package org.example.client;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import org.example.dto.OperationType;
import org.example.exception.ForbiddenException;
import org.example.exception.ServiceUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Component
public class CoreClient {

    private static final Logger log = LoggerFactory.getLogger(CoreClient.class);
    private static final int PAGE_SIZE = 100;
    private static final int MAX_PAGES = 1000;

    private final RestClient coreRestClient;

    public CoreClient(RestClient coreRestClient) {
        this.coreRestClient = coreRestClient;
    }

    @Retry(name = "core")
    @CircuitBreaker(name = "core", fallbackMethod = "fetchOperationsFallback")
    public List<OperationView> fetchOperations(String bearerToken, UUID familyId,
                                               LocalDate from, LocalDate to, OperationType type) {
        List<OperationView> all = new ArrayList<>();
        int page = 0;
        int totalPages = 1;
        do {
            OperationPageView pageView = fetchPage(bearerToken, familyId, from, to, type, page, PAGE_SIZE);
            all.addAll(pageView.content());
            totalPages = Math.max(pageView.totalPages(), 1);
            page++;
        } while (page < totalPages && page < MAX_PAGES);
        return all;
    }

    @Retry(name = "core")
    @CircuitBreaker(name = "core", fallbackMethod = "fetchTotalsFallback")
    public Totals fetchTotals(String bearerToken, UUID familyId, LocalDate from, LocalDate to) {
        OperationPageView page = fetchPage(bearerToken, familyId, from, to, null, 0, 1);
        return new Totals(zeroIfNull(page.totalIncome()), zeroIfNull(page.totalExpense()));
    }

    @SuppressWarnings("unused")
    private Totals fetchTotalsFallback(String bearerToken, UUID familyId,
                                       LocalDate from, LocalDate to, Throwable t) {
        if (t instanceof ForbiddenException fe) {
            throw fe;
        }
        log.warn("core-service недоступен (resilience fallback): {}", t.getMessage());
        throw new ServiceUnavailableException();
    }

    public record Totals(BigDecimal income, BigDecimal expense) {
    }

    private static BigDecimal zeroIfNull(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    @SuppressWarnings("unused")
    private List<OperationView> fetchOperationsFallback(String bearerToken, UUID familyId,
                                                        LocalDate from, LocalDate to,
                                                        OperationType type, Throwable t) {
        if (t instanceof ForbiddenException fe) {
            throw fe;
        }
        log.warn("core-service недоступен (resilience fallback): {}", t.getMessage());
        throw new ServiceUnavailableException();
    }

    private OperationPageView fetchPage(String bearerToken, UUID familyId,
                                        LocalDate from, LocalDate to, OperationType type, int page, int size) {
        try {
            return coreRestClient.get()
                    .uri(uri -> {
                        uri.path("/operations")
                                .queryParam("familyId", familyId)
                                .queryParam("from", from)
                                .queryParam("to", to)
                                .queryParam("page", page)
                                .queryParam("size", size);
                        if (type != null) {
                            uri.queryParam("type", type);
                        }
                        return uri.build();
                    })
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + bearerToken)
                    .retrieve()
                    .body(OperationPageView.class);
        } catch (HttpClientErrorException.Forbidden | HttpClientErrorException.Unauthorized e) {
            throw new ForbiddenException();
        } catch (RestClientException e) {
            log.warn("core-service недоступен при запросе операций: {}", e.getMessage());
            throw new ServiceUnavailableException();
        }
    }
}

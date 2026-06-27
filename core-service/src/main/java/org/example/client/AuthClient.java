package org.example.client;

import org.example.exception.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

/** Клиент к auth-service: используется, чтобы проверить, что приглашаемый email зарегистрирован. */
@Component
public class AuthClient {

    private static final Logger log = LoggerFactory.getLogger(AuthClient.class);

    private final RestClient authRestClient;

    public AuthClient(RestClient authRestClient) {
        this.authRestClient = authRestClient;
    }

    public boolean emailRegistered(String email, String bearerToken) {
        try {
            ExistsResponse res = authRestClient.get()
                    .uri(uri -> uri.path("/users/exists").queryParam("email", email).build())
                    .header(HttpHeaders.AUTHORIZATION, bearerToken)
                    .retrieve()
                    .body(ExistsResponse.class);
            return res != null && res.exists();
        } catch (RestClientException e) {
            log.warn("Не удалось проверить email в auth-service: {}", e.getMessage());
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "AUTH_UNAVAILABLE",
                    "Не удалось проверить email, попробуйте позже");
        }
    }

    public record ExistsResponse(boolean exists) {
    }
}

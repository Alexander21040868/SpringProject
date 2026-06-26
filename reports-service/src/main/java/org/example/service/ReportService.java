package org.example.service;

import org.example.client.CoreClient;
import org.example.client.OperationView;
import org.example.dto.CashflowPointDto;
import org.example.dto.CategorySliceDto;
import org.example.dto.Granularity;
import org.example.dto.MemberSliceDto;
import org.example.dto.OperationType;
import org.example.dto.SummaryReportDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
public class ReportService {

    private static final int MONEY_SCALE = 2;

    private final CoreClient coreClient;

    public ReportService(CoreClient coreClient) {
        this.coreClient = coreClient;
    }

    public SummaryReportDto summary(String token, UUID familyId, LocalDate from, LocalDate to,
                                    Set<UUID> memberIds) {
        CoreClient.Totals totals = periodTotals(token, familyId, from, to, memberIds);
        BigDecimal income = totals.income().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal expense = totals.expense().setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        BigDecimal savings = income.subtract(expense);

        BigDecimal savingsRate = income.signum() > 0
                ? clamp01(savings.divide(income, 4, RoundingMode.HALF_UP))
                : BigDecimal.ZERO;

        BigDecimal incomeChangePct = incomeChangePct(token, familyId, from, to, memberIds, income);

        return new SummaryReportDto(from, to, income, expense, savings, savings, savingsRate, incomeChangePct);
    }

    private CoreClient.Totals periodTotals(String token, UUID familyId, LocalDate from, LocalDate to,
                                           Set<UUID> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return coreClient.fetchTotals(token, familyId, from, to);
        }
        List<OperationView> ops = filterMembers(
                coreClient.fetchOperations(token, familyId, from, to, null), memberIds);
        return new CoreClient.Totals(sum(ops, OperationType.INCOME), sum(ops, OperationType.EXPENSE));
    }

    public List<CategorySliceDto> byCategory(String token, UUID familyId, LocalDate from, LocalDate to,
                                             Set<UUID> memberIds, OperationType type) {
        OperationType effectiveType = type != null ? type : OperationType.EXPENSE;
        List<OperationView> ops = filterMembers(
                coreClient.fetchOperations(token, familyId, from, to, effectiveType), memberIds);

        Map<UUID, BigDecimal> byCat = new LinkedHashMap<>();
        Map<UUID, OperationView.CategoryView> meta = new LinkedHashMap<>();
        for (OperationView op : ops) {
            if (op.category() == null) {
                continue;
            }
            byCat.merge(op.category().id(), op.amount(), BigDecimal::add);
            meta.putIfAbsent(op.category().id(), op.category());
        }
        BigDecimal total = total(byCat.values());

        return byCat.entrySet().stream()
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .map(e -> {
                    OperationView.CategoryView c = meta.get(e.getKey());
                    return new CategorySliceDto(c.id(), c.name(), c.icon(), c.color(),
                            e.getValue(), percent(e.getValue(), total));
                })
                .toList();
    }

    public List<MemberSliceDto> byMember(String token, UUID familyId, LocalDate from, LocalDate to,
                                         Set<UUID> memberIds, OperationType type) {
        OperationType effectiveType = type != null ? type : OperationType.EXPENSE;
        List<OperationView> ops = filterMembers(
                coreClient.fetchOperations(token, familyId, from, to, effectiveType), memberIds);

        Map<UUID, BigDecimal> byMember = new LinkedHashMap<>();
        Map<UUID, OperationView.MemberView> meta = new LinkedHashMap<>();
        for (OperationView op : ops) {
            OperationView.MemberView m = op.member();
            UUID key = m != null ? m.userId() : null;
            byMember.merge(key, op.amount(), BigDecimal::add);
            meta.putIfAbsent(key, m);
        }
        BigDecimal total = total(byMember.values());

        return byMember.entrySet().stream()
                .sorted(Map.Entry.<UUID, BigDecimal>comparingByValue().reversed())
                .map(e -> {
                    OperationView.MemberView m = meta.get(e.getKey());
                    String name = m != null ? m.name() : "—";
                    String color = m != null ? m.color() : null;
                    return new MemberSliceDto(e.getKey(), name, color, e.getValue(), percent(e.getValue(), total));
                })
                .toList();
    }

    public List<CashflowPointDto> cashflow(String token, UUID familyId, LocalDate from, LocalDate to,
                                           Set<UUID> memberIds, Granularity granularity) {
        Granularity g = granularity != null ? granularity : Granularity.MONTH;
        List<OperationView> ops = filterMembers(
                coreClient.fetchOperations(token, familyId, from, to, null), memberIds);

        Map<String, String> series = CashflowBuckets.series(from, to, g);
        Map<String, BigDecimal> income = new LinkedHashMap<>();
        Map<String, BigDecimal> expense = new LinkedHashMap<>();
        for (String key : series.keySet()) {
            income.put(key, BigDecimal.ZERO);
            expense.put(key, BigDecimal.ZERO);
        }
        for (OperationView op : ops) {
            String key = CashflowBuckets.keyOf(op.date(), g);
            Map<String, BigDecimal> target = op.type() == OperationType.INCOME ? income : expense;
            target.computeIfPresent(key, (k, v) -> v.add(op.amount()));
        }

        return series.entrySet().stream()
                .map(e -> new CashflowPointDto(e.getKey(), e.getValue(),
                        income.get(e.getKey()), expense.get(e.getKey())))
                .toList();
    }

    public List<OperationView> operationsForExport(String token, UUID familyId, LocalDate from,
                                                   LocalDate to, Set<UUID> memberIds) {
        return filterMembers(coreClient.fetchOperations(token, familyId, from, to, null), memberIds).stream()
                .sorted(Comparator.comparing(OperationView::date))
                .toList();
    }

    private BigDecimal incomeChangePct(String token, UUID familyId, LocalDate from, LocalDate to,
                                       Set<UUID> memberIds, BigDecimal income) {
        long days = java.time.temporal.ChronoUnit.DAYS.between(from, to) + 1;
        LocalDate prevTo = from.minusDays(1);
        LocalDate prevFrom = prevTo.minusDays(days - 1);
        BigDecimal prevIncome = periodTotals(token, familyId, prevFrom, prevTo, memberIds).income();
        if (prevIncome.signum() == 0) {
            return null;
        }
        return income.subtract(prevIncome)
                .multiply(BigDecimal.valueOf(100))
                .divide(prevIncome, 1, RoundingMode.HALF_UP);
    }

    private List<OperationView> filterMembers(List<OperationView> ops, Set<UUID> memberIds) {
        if (memberIds == null || memberIds.isEmpty()) {
            return ops;
        }
        return ops.stream()
                .filter(op -> op.member() != null && memberIds.contains(op.member().userId()))
                .toList();
    }

    private BigDecimal sum(List<OperationView> ops, OperationType type) {
        return ops.stream()
                .filter(op -> op.type() == type)
                .map(OperationView::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal total(Collection<BigDecimal> values) {
        return values.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private BigDecimal percent(BigDecimal part, BigDecimal total) {
        if (total.signum() == 0) {
            return BigDecimal.ZERO;
        }
        return part.multiply(BigDecimal.valueOf(100)).divide(total, MONEY_SCALE, RoundingMode.HALF_UP);
    }

    private BigDecimal clamp01(BigDecimal v) {
        if (v.signum() < 0) {
            return BigDecimal.ZERO;
        }
        return v.min(BigDecimal.ONE);
    }
}

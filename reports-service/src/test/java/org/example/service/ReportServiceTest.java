package org.example.service;

import org.example.client.CoreClient;
import org.example.client.OperationView;
import org.example.dto.CashflowPointDto;
import org.example.dto.CategorySliceDto;
import org.example.dto.Granularity;
import org.example.dto.MemberSliceDto;
import org.example.dto.OperationType;
import org.example.dto.SummaryReportDto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ReportServiceTest {

    private static final String TOKEN = "t";
    private static final UUID FAMILY = UUID.randomUUID();
    private static final LocalDate FROM = LocalDate.parse("2026-06-01");
    private static final LocalDate TO = LocalDate.parse("2026-06-30");

    private static final UUID FOOD = UUID.randomUUID();
    private static final UUID TRANSPORT = UUID.randomUUID();
    private static final UUID ALICE = UUID.randomUUID();
    private static final UUID BOB = UUID.randomUUID();

    private static final class FakeCoreClient extends CoreClient {
        private final List<OperationView> ops;

        FakeCoreClient(List<OperationView> ops) {
            super(null);
            this.ops = ops;
        }

        @Override
        public List<OperationView> fetchOperations(String token, UUID familyId, LocalDate from,
                                                   LocalDate to, OperationType type) {
            return type == OperationType.INCOME ? List.of() : ops;
        }

        @Override
        public CoreClient.Totals fetchTotals(String token, UUID familyId, LocalDate from, LocalDate to) {
            if (from.isBefore(LocalDate.parse("2026-06-01"))) {
                return new CoreClient.Totals(BigDecimal.ZERO, BigDecimal.ZERO);
            }
            return new CoreClient.Totals(sumByType(OperationType.INCOME), sumByType(OperationType.EXPENSE));
        }

        private BigDecimal sumByType(OperationType type) {
            return ops.stream()
                    .filter(o -> o.type() == type)
                    .map(OperationView::amount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }
    }

    private ReportService serviceReturning(List<OperationView> ops) {
        return new ReportService(new FakeCoreClient(ops));
    }

    private OperationView income(String amount, LocalDate date, UUID member) {
        return new OperationView(UUID.randomUUID(), OperationType.INCOME, new BigDecimal(amount), "RUB", date, null,
                new OperationView.CategoryView(UUID.randomUUID(), "ЗП", null, null, OperationType.INCOME),
                new OperationView.MemberView(member, "Алиса", "#185FA5"));
    }

    private OperationView expense(String amount, LocalDate date, UUID categoryId, String catName,
                                  UUID member, String memberName) {
        return new OperationView(UUID.randomUUID(), OperationType.EXPENSE, new BigDecimal(amount), "RUB", date, "x",
                new OperationView.CategoryView(categoryId, catName, null, "#1D9E75", OperationType.EXPENSE),
                new OperationView.MemberView(member, memberName, "#185FA5"));
    }

    @Test
    void summaryComputesIncomeExpenseBalanceAndSavingsRate() {
        ReportService service = serviceReturning(List.of(
                income("100000", FROM, ALICE),
                expense("20000", FROM, FOOD, "Еда", ALICE, "Алиса"),
                expense("5000", FROM, TRANSPORT, "Транспорт", ALICE, "Алиса")));

        SummaryReportDto r = service.summary(TOKEN, FAMILY, FROM, TO, null);

        assertThat(r.income()).isEqualByComparingTo("100000");
        assertThat(r.expense()).isEqualByComparingTo("25000");
        assertThat(r.balance()).isEqualByComparingTo("75000");
        assertThat(r.savings()).isEqualByComparingTo("75000");
        assertThat(r.savingsRate()).isEqualByComparingTo("0.75");
        assertThat(r.incomeChangePct()).isNull();
    }

    @Test
    void byCategoryReturnsSharesSortedDesc() {
        ReportService service = serviceReturning(List.of(
                expense("30000", FROM, FOOD, "Еда", ALICE, "Алиса"),
                expense("10000", FROM, TRANSPORT, "Транспорт", ALICE, "Алиса")));

        List<CategorySliceDto> slices = service.byCategory(TOKEN, FAMILY, FROM, TO, null, OperationType.EXPENSE);

        assertThat(slices).hasSize(2);
        assertThat(slices.get(0).name()).isEqualTo("Еда");
        assertThat(slices.get(0).amount()).isEqualByComparingTo("30000");
        assertThat(slices.get(0).percent()).isEqualByComparingTo("75.00");
        assertThat(slices.get(1).percent()).isEqualByComparingTo("25.00");
    }

    @Test
    void byMemberGroupsByUser() {
        ReportService service = serviceReturning(List.of(
                expense("8000", FROM, FOOD, "Еда", ALICE, "Алиса"),
                expense("2000", FROM, FOOD, "Еда", BOB, "Боб")));

        List<MemberSliceDto> slices = service.byMember(TOKEN, FAMILY, FROM, TO, null, OperationType.EXPENSE);

        assertThat(slices).hasSize(2);
        assertThat(slices.get(0).name()).isEqualTo("Алиса");
        assertThat(slices.get(0).percent()).isEqualByComparingTo("80.00");
    }

    @Test
    void memberFilterKeepsOnlySelectedMembers() {
        ReportService service = serviceReturning(List.of(
                expense("8000", FROM, FOOD, "Еда", ALICE, "Алиса"),
                expense("2000", FROM, FOOD, "Еда", BOB, "Боб")));

        List<MemberSliceDto> slices =
                service.byMember(TOKEN, FAMILY, FROM, TO, Set.of(ALICE), OperationType.EXPENSE);

        assertThat(slices).hasSize(1);
        assertThat(slices.get(0).name()).isEqualTo("Алиса");
        assertThat(slices.get(0).percent()).isEqualByComparingTo("100.00");
    }

    @Test
    void cashflowGroupsByMonthAcrossRange() {
        ReportService service = serviceReturning(List.of(
                income("80000", LocalDate.parse("2026-05-01"), ALICE),
                income("90000", LocalDate.parse("2026-06-01"), ALICE),
                expense("12000", LocalDate.parse("2026-06-10"), FOOD, "Еда", ALICE, "Алиса")));

        List<CashflowPointDto> points = service.cashflow(
                TOKEN, FAMILY, LocalDate.parse("2026-05-01"), TO, null, Granularity.MONTH);

        assertThat(points).hasSize(2);
        assertThat(points.get(0).month()).isEqualTo("2026-05");
        assertThat(points.get(0).income()).isEqualByComparingTo("80000");
        assertThat(points.get(0).expense()).isEqualByComparingTo("0");
        assertThat(points.get(1).month()).isEqualTo("2026-06");
        assertThat(points.get(1).income()).isEqualByComparingTo("90000");
        assertThat(points.get(1).expense()).isEqualByComparingTo("12000");
    }
}

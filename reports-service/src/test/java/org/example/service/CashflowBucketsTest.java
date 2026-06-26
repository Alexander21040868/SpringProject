package org.example.service;

import org.example.dto.Granularity;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class CashflowBucketsTest {

    @Test
    void monthSeriesCoversEveryMonthInRange() {
        Map<String, String> series = CashflowBuckets.series(
                LocalDate.parse("2026-04-15"), LocalDate.parse("2026-06-02"), Granularity.MONTH);

        assertThat(series.keySet()).containsExactly("2026-04", "2026-05", "2026-06");
        assertThat(series.get("2026-04")).isEqualTo("Апр");
        assertThat(series.get("2026-06")).isEqualTo("Июн");
    }

    @Test
    void daySeriesHasOneBucketPerDay() {
        Map<String, String> series = CashflowBuckets.series(
                LocalDate.parse("2026-06-01"), LocalDate.parse("2026-06-03"), Granularity.DAY);

        assertThat(series.keySet()).containsExactly("2026-06-01", "2026-06-02", "2026-06-03");
        assertThat(series.get("2026-06-01")).isEqualTo("01.06");
    }

    @Test
    void weekKeyIsMondayOfThatWeek() {
        assertThat(CashflowBuckets.keyOf(LocalDate.parse("2026-06-10"), Granularity.WEEK))
                .isEqualTo("2026-06-08");
    }

    @Test
    void monthKeyIsYearMonth() {
        assertThat(CashflowBuckets.keyOf(LocalDate.parse("2026-06-10"), Granularity.MONTH))
                .isEqualTo("2026-06");
    }
}

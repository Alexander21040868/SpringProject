package org.example.service;

import org.example.dto.Granularity;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.TemporalAdjusters;
import java.util.LinkedHashMap;
import java.util.Map;

final class CashflowBuckets {

    private static final String[] MONTHS_RU = {
            "Янв", "Фев", "Мар", "Апр", "Май", "Июн",
            "Июл", "Авг", "Сен", "Окт", "Ноя", "Дек"
    };
    private static final DateTimeFormatter DAY_KEY = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DAY_LABEL = DateTimeFormatter.ofPattern("dd.MM");
    private static final DateTimeFormatter MONTH_KEY = DateTimeFormatter.ofPattern("yyyy-MM");

    private CashflowBuckets() {
    }

    static String keyOf(LocalDate date, Granularity g) {
        return switch (g) {
            case DAY -> date.format(DAY_KEY);
            case WEEK -> date.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).format(DAY_KEY);
            case MONTH -> date.format(MONTH_KEY);
        };
    }

    static Map<String, String> series(LocalDate from, LocalDate to, Granularity g) {
        Map<String, String> result = new LinkedHashMap<>();
        switch (g) {
            case DAY -> {
                for (LocalDate d = from; !d.isAfter(to); d = d.plusDays(1)) {
                    result.put(d.format(DAY_KEY), d.format(DAY_LABEL));
                }
            }
            case WEEK -> {
                LocalDate start = from.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                for (LocalDate d = start; !d.isAfter(to); d = d.plusWeeks(1)) {
                    result.put(d.format(DAY_KEY), d.format(DAY_LABEL));
                }
            }
            case MONTH -> {
                YearMonth start = YearMonth.from(from);
                YearMonth end = YearMonth.from(to);
                for (YearMonth m = start; !m.isAfter(end); m = m.plusMonths(1)) {
                    result.put(m.format(MONTH_KEY), MONTHS_RU[m.getMonthValue() - 1]);
                }
            }
        }
        return result;
    }
}

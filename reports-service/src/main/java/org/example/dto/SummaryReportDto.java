package org.example.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.math.BigDecimal;
import java.time.LocalDate;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record SummaryReportDto(
        LocalDate from,
        LocalDate to,
        BigDecimal income,
        BigDecimal expense,
        BigDecimal balance,
        BigDecimal savings,
        BigDecimal savingsRate,
        BigDecimal incomeChangePct
) {
}

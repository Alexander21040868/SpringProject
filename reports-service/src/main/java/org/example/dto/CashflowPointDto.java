package org.example.dto;

import java.math.BigDecimal;

public record CashflowPointDto(
        String month,
        String label,
        BigDecimal income,
        BigDecimal expense
) {
}

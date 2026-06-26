package org.example.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record LimitStatusDto(
        UUID categoryId,
        String name,
        String icon,
        String color,
        BigDecimal limit,
        BigDecimal spent,
        BigDecimal percent,
        String status
) {
}

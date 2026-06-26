package org.example.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record CategorySliceDto(
        UUID categoryId,
        String name,
        String icon,
        String color,
        BigDecimal amount,
        BigDecimal percent
) {
}

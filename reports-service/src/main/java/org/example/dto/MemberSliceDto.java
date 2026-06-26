package org.example.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record MemberSliceDto(
        UUID userId,
        String name,
        String color,
        BigDecimal amount,
        BigDecimal percent
) {
}

package org.example.dto;

import org.example.entity.Currency;
import org.example.entity.OperationType;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record OperationDto(
        UUID id,
        UUID familyId,
        OperationType type,
        BigDecimal amount,
        Currency currency,
        LocalDate date,
        String description,
        CategoryDto category,
        MemberDto member,
        Instant createdAt
) {
}

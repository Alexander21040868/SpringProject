package org.example.dto;

import org.example.entity.Currency;
import org.example.entity.Role;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

public record FamilyDto(
        UUID id,
        String name,
        Currency currency,
        BigDecimal balance,
        long membersCount,
        Role myRole,
        Instant createdAt
) {
}

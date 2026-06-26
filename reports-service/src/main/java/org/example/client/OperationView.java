package org.example.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.example.dto.OperationType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OperationView(
        UUID id,
        OperationType type,
        BigDecimal amount,
        String currency,
        LocalDate date,
        String description,
        CategoryView category,
        MemberView member
) {

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CategoryView(UUID id, String name, String icon, String color, OperationType type) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record MemberView(UUID userId, String name, String color) {
    }
}

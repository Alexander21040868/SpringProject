package org.example.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.entity.Currency;
import org.example.entity.OperationType;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record OperationRequest(

        @NotNull
        UUID familyId,

        @NotNull
        OperationType type,

        @NotNull
        @DecimalMin(value = "0", inclusive = false, message = "должно быть больше 0")
        @Digits(integer = 17, fraction = 2)
        BigDecimal amount,

        Currency currency,

        @NotNull
        LocalDate date,

        @Size(max = 255)
        String description,

        @NotNull
        UUID categoryId,

        UUID memberId
) {
}

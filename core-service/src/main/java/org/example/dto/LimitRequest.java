package org.example.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public record LimitRequest(

        @NotNull
        UUID categoryId,

        @NotNull
        @DecimalMin(value = "0", message = "не должно быть отрицательным")
        @Digits(integer = 17, fraction = 2)
        BigDecimal amount
) {
}

package org.example.dto;

import jakarta.validation.constraints.Size;
import org.example.entity.Currency;

public record UpdateUserRequest(

        @Size(min = 1, max = 100)
        String name,

        Currency defaultCurrency
) {
}

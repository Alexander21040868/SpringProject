package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.example.entity.Currency;

public record CreateFamilyRequest(

        @NotBlank
        @Size(min = 1, max = 100)
        String name,

        Currency currency
) {
}

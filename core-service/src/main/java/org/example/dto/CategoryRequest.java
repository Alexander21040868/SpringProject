package org.example.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.example.entity.OperationType;

import java.util.UUID;

public record CategoryRequest(

        @NotNull
        UUID familyId,

        @NotBlank
        @Size(min = 1, max = 60)
        String name,

        @NotNull
        OperationType type,

        String icon,

        String color
) {
}

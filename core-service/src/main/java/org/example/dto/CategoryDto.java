package org.example.dto;

import org.example.entity.Category;
import org.example.entity.OperationType;

import java.math.BigDecimal;
import java.util.UUID;

public record CategoryDto(
        UUID id,
        UUID familyId,
        String name,
        OperationType type,
        String icon,
        String color,
        Long operationsCount,
        BigDecimal total
) {

    public static CategoryDto from(Category c) {
        return new CategoryDto(c.getId(), c.getFamily().getId(), c.getName(),
                c.getType(), c.getIcon(), c.getColor(), null, null);
    }
}

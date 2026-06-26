package org.example.dto;

import java.math.BigDecimal;
import java.util.List;

public record OperationPageDto(
        List<OperationDto> content,
        int page,
        int size,
        long totalElements,
        int totalPages,
        BigDecimal totalIncome,
        BigDecimal totalExpense
) {
}

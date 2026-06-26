package org.example.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record OperationPageView(
        List<OperationView> content,
        int totalPages,
        BigDecimal totalIncome,
        BigDecimal totalExpense
) {
}

package org.example.service;

import org.example.dto.LimitRequest;
import org.example.dto.LimitStatusDto;
import org.example.entity.Category;
import org.example.entity.Family;
import org.example.entity.Limit;
import org.example.exception.BadRequestException;
import org.example.exception.NotFoundException;
import org.example.repository.CategoryRepository;
import org.example.repository.FamilyRepository;
import org.example.repository.LimitRepository;
import org.example.repository.OperationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class LimitService {

    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");
    private static final BigDecimal WARN_THRESHOLD = new BigDecimal("80");
    private static final BigDecimal EXCEEDED_THRESHOLD = new BigDecimal("100");

    private final LimitRepository limitRepository;
    private final CategoryRepository categoryRepository;
    private final FamilyRepository familyRepository;
    private final OperationRepository operationRepository;
    private final AccessService access;

    public LimitService(LimitRepository limitRepository,
                        CategoryRepository categoryRepository,
                        FamilyRepository familyRepository,
                        OperationRepository operationRepository,
                        AccessService access) {
        this.limitRepository = limitRepository;
        this.categoryRepository = categoryRepository;
        this.familyRepository = familyRepository;
        this.operationRepository = operationRepository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public List<LimitStatusDto> getLimits(UUID familyId, UUID userId, String month) {
        access.requireMember(familyId, userId);
        YearMonth ym = parseMonth(month);
        LocalDate from = ym.atDay(1);
        LocalDate to = ym.atEndOfMonth();

        Map<UUID, BigDecimal> spentByCategory = new HashMap<>();
        for (Object[] row : operationRepository.sumExpenseByCategoryGrouped(familyId, from, to)) {
            spentByCategory.put((UUID) row[0], toBigDecimal(row[1]));
        }
        return limitRepository.findByFamily_Id(familyId).stream()
                .map(limit -> toStatus(limit, spentByCategory))
                .toList();
    }

    @Transactional
    public List<LimitStatusDto> setLimits(UUID familyId, UUID userId, List<LimitRequest> requests) {
        access.requireOwner(familyId, userId);
        Family family = familyRepository.findById(familyId).orElseThrow(NotFoundException::family);

        for (LimitRequest req : requests) {
            if (req.amount() == null || req.amount().signum() < 0) {
                throw new BadRequestException("INVALID_LIMIT", "Сумма лимита не должна быть отрицательной");
            }
            Category category = categoryRepository.findByIdAndFamily_Id(req.categoryId(), familyId)
                    .orElseThrow(NotFoundException::category);
            limitRepository.findByFamily_IdAndCategory_Id(familyId, req.categoryId())
                    .ifPresentOrElse(
                            existing -> existing.setAmount(req.amount()),
                            () -> limitRepository.save(new Limit(family, category, req.amount())));
        }
        return getLimits(familyId, userId, null);
    }

    private LimitStatusDto toStatus(Limit limit, Map<UUID, BigDecimal> spentByCategory) {
        Category category = limit.getCategory();
        BigDecimal spent = spentByCategory.getOrDefault(category.getId(), BigDecimal.ZERO);
        BigDecimal limitAmount = limit.getAmount();

        BigDecimal percent = limitAmount.signum() == 0
                ? BigDecimal.ZERO
                : spent.multiply(BigDecimal.valueOf(100)).divide(limitAmount, 1, RoundingMode.HALF_UP);

        return new LimitStatusDto(category.getId(), category.getName(), category.getIcon(),
                category.getColor(), limitAmount, spent, percent, status(percent));
    }

    private String status(BigDecimal percent) {
        if (percent.compareTo(EXCEEDED_THRESHOLD) >= 0) {
            return "EXCEEDED";
        }
        if (percent.compareTo(WARN_THRESHOLD) >= 0) {
            return "WARNING";
        }
        return "OK";
    }

    private static BigDecimal toBigDecimal(Object value) {
        return value instanceof BigDecimal bd ? bd : new BigDecimal(value.toString());
    }

    private YearMonth parseMonth(String month) {
        if (month == null || month.isBlank()) {
            return YearMonth.now();
        }
        try {
            return YearMonth.parse(month, MONTH);
        } catch (DateTimeParseException e) {
            throw new BadRequestException("INVALID_MONTH", "Некорректный формат месяца, ожидается YYYY-MM");
        }
    }
}

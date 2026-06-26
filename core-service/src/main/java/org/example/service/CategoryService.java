package org.example.service;

import org.example.dto.CategoryDto;
import org.example.dto.CategoryRequest;
import org.example.entity.Category;
import org.example.entity.Family;
import org.example.entity.OperationType;
import org.example.exception.ConflictException;
import org.example.exception.NotFoundException;
import org.example.repository.CategoryRepository;
import org.example.repository.FamilyRepository;
import org.example.repository.OperationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final FamilyRepository familyRepository;
    private final OperationRepository operationRepository;
    private final AccessService access;

    public CategoryService(CategoryRepository categoryRepository,
                           FamilyRepository familyRepository,
                           OperationRepository operationRepository,
                           AccessService access) {
        this.categoryRepository = categoryRepository;
        this.familyRepository = familyRepository;
        this.operationRepository = operationRepository;
        this.access = access;
    }

    @Transactional(readOnly = true)
    public List<CategoryDto> list(UUID familyId, UUID userId, OperationType type) {
        access.requireMember(familyId, userId);
        List<Category> categories = type != null
                ? categoryRepository.findByFamily_IdAndType(familyId, type)
                : categoryRepository.findByFamily_Id(familyId);

        Map<UUID, long[]> counts = new HashMap<>();
        Map<UUID, BigDecimal> totals = new HashMap<>();
        for (Object[] row : operationRepository.aggregateByCategory(familyId)) {
            UUID categoryId = (UUID) row[0];
            counts.put(categoryId, new long[]{((Number) row[1]).longValue()});
            totals.put(categoryId, (BigDecimal) row[2]);
        }

        return categories.stream()
                .map(c -> new CategoryDto(c.getId(), familyId, c.getName(), c.getType(),
                        c.getIcon(), c.getColor(),
                        counts.containsKey(c.getId()) ? counts.get(c.getId())[0] : 0L,
                        totals.getOrDefault(c.getId(), BigDecimal.ZERO)))
                .toList();
    }

    @Transactional
    public CategoryDto create(UUID userId, CategoryRequest request) {
        access.requireWriter(request.familyId(), userId);
        Family family = familyRepository.findById(request.familyId())
                .orElseThrow(NotFoundException::family);
        Category category = new Category(family, request.name(), request.type(),
                request.icon(), request.color());
        categoryRepository.save(category);
        return CategoryDto.from(category);
    }

    @Transactional
    public CategoryDto update(UUID categoryId, UUID userId, CategoryRequest request) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(NotFoundException::category);
        access.requireWriter(category.getFamily().getId(), userId);
        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        category.setColor(request.color());
        return CategoryDto.from(category);
    }

    @Transactional
    public void delete(UUID categoryId, UUID userId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(NotFoundException::category);
        access.requireWriter(category.getFamily().getId(), userId);
        if (operationRepository.existsByCategory_Id(categoryId)) {
            throw new ConflictException("CATEGORY_NOT_EMPTY",
                    "Нельзя удалить категорию, по которой есть операции");
        }
        categoryRepository.delete(category);
    }
}

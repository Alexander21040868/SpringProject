package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.CategoryDto;
import org.example.dto.CategoryRequest;
import org.example.entity.OperationType;
import org.example.security.AuthPrincipal;
import org.example.service.CategoryService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public List<CategoryDto> list(@AuthenticationPrincipal AuthPrincipal principal,
                                  @RequestParam UUID familyId,
                                  @RequestParam(required = false) OperationType type) {
        return categoryService.list(familyId, principal.id(), type);
    }

    @PostMapping
    public ResponseEntity<CategoryDto> create(@AuthenticationPrincipal AuthPrincipal principal,
                                              @Valid @RequestBody CategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.create(principal.id(), request));
    }

    @PatchMapping("/{categoryId}")
    public CategoryDto update(@AuthenticationPrincipal AuthPrincipal principal,
                              @PathVariable UUID categoryId,
                              @Valid @RequestBody CategoryRequest request) {
        return categoryService.update(categoryId, principal.id(), request);
    }

    @DeleteMapping("/{categoryId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthPrincipal principal,
                       @PathVariable UUID categoryId) {
        categoryService.delete(categoryId, principal.id());
    }
}

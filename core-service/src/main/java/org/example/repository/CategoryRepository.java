package org.example.repository;

import org.example.entity.Category;
import org.example.entity.OperationType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, UUID> {

    List<Category> findByFamily_Id(UUID familyId);

    List<Category> findByFamily_IdAndType(UUID familyId, OperationType type);

    Optional<Category> findByIdAndFamily_Id(UUID id, UUID familyId);
}

package org.example.repository;

import org.example.entity.Limit;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LimitRepository extends JpaRepository<Limit, UUID> {

    List<Limit> findByFamily_Id(UUID familyId);

    Optional<Limit> findByFamily_IdAndCategory_Id(UUID familyId, UUID categoryId);
}

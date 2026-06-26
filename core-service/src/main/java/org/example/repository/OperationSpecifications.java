package org.example.repository;

import jakarta.persistence.criteria.Predicate;
import org.example.entity.Operation;
import org.example.entity.OperationType;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

public final class OperationSpecifications {

    private OperationSpecifications() {
    }

    public static Specification<Operation> matching(UUID familyId, OperationType type, UUID categoryId,
                                                    UUID memberUserId, LocalDate from, LocalDate to,
                                                    String search) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("family").get("id"), familyId));
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            }
            if (memberUserId != null) {
                predicates.add(cb.equal(root.get("memberUserId"), memberUserId));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("date"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("date"), to));
            }
            if (search != null && !search.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("description")),
                        "%" + search.trim().toLowerCase() + "%"));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}

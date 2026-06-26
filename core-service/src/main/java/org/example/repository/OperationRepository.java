package org.example.repository;

import org.example.entity.Operation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OperationRepository extends JpaRepository<Operation, UUID>,
        JpaSpecificationExecutor<Operation> {

    @Query("""
            select coalesce(sum(o.amount), 0) from Operation o
            where o.family.id = :familyId
              and o.type = :type
              and o.date >= :from and o.date <= :to
            """)
    BigDecimal sumAmount(@Param("familyId") UUID familyId,
                         @Param("type") org.example.entity.OperationType type,
                         @Param("from") LocalDate from,
                         @Param("to") LocalDate to);

    @Query("""
            select o.category.id, count(o), coalesce(sum(o.amount), 0)
            from Operation o
            where o.family.id = :familyId
            group by o.category.id
            """)
    List<Object[]> aggregateByCategory(@Param("familyId") UUID familyId);

    @Query("""
            select coalesce(sum(o.amount), 0) from Operation o
            where o.category.id = :categoryId
              and o.type = org.example.entity.OperationType.EXPENSE
              and o.date >= :from and o.date <= :to
            """)
    BigDecimal sumExpenseByCategory(@Param("categoryId") UUID categoryId,
                                    @Param("from") LocalDate from,
                                    @Param("to") LocalDate to);

    @EntityGraph(attributePaths = "category")
    Optional<Operation> findByIdAndFamily_Id(UUID id, UUID familyId);

    boolean existsByCategory_Id(UUID categoryId);
}

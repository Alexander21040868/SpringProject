package org.example.repository;

import org.example.entity.Membership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MembershipRepository extends JpaRepository<Membership, UUID> {

    List<Membership> findByFamily_Id(UUID familyId);

    List<Membership> findByUserId(UUID userId);

    Optional<Membership> findByFamily_IdAndUserId(UUID familyId, UUID userId);

    boolean existsByFamily_IdAndUserId(UUID familyId, UUID userId);

    long countByFamily_Id(UUID familyId);
}

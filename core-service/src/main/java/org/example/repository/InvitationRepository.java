package org.example.repository;

import org.example.entity.Invitation;
import org.example.entity.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface InvitationRepository extends JpaRepository<Invitation, UUID> {

    List<Invitation> findByFamily_Id(UUID familyId);

    List<Invitation> findByEmailAndStatus(String email, InvitationStatus status);

    Optional<Invitation> findByIdAndFamily_Id(UUID id, UUID familyId);

    boolean existsByFamily_IdAndEmailAndStatus(UUID familyId, String email, InvitationStatus status);
}

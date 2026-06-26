package org.example.dto;

import org.example.entity.Invitation;
import org.example.entity.Role;

import java.time.Instant;
import java.util.UUID;

public record MyInvitationDto(
        UUID id,
        UUID familyId,
        String familyName,
        Role role,
        String invitedBy,
        Instant createdAt
) {

    public static MyInvitationDto from(Invitation i) {
        return new MyInvitationDto(
                i.getId(),
                i.getFamily().getId(),
                i.getFamily().getName(),
                i.getRole(),
                i.getInvitedByName(),
                i.getCreatedAt());
    }
}

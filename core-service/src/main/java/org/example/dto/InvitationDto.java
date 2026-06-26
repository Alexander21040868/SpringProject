package org.example.dto;

import org.example.entity.Invitation;
import org.example.entity.InvitationStatus;
import org.example.entity.Role;

import java.time.Instant;
import java.util.UUID;

public record InvitationDto(
        UUID id,
        String email,
        Role role,
        InvitationStatus status,
        Instant createdAt
) {

    public static InvitationDto from(Invitation i) {
        return new InvitationDto(i.getId(), i.getEmail(), i.getRole(), i.getStatus(), i.getCreatedAt());
    }
}

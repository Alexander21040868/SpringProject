package org.example.dto;

import org.example.entity.Membership;
import org.example.entity.Role;

import java.time.Instant;
import java.util.UUID;

public record MemberDto(
        UUID id,
        UUID userId,
        String name,
        String email,
        Role role,
        String color,
        Instant joinedAt
) {

    public static MemberDto from(Membership m) {
        return new MemberDto(m.getId(), m.getUserId(), m.getDisplayName(),
                m.getEmail(), m.getRole(), m.getColor(), m.getJoinedAt());
    }
}

package org.example.dto;

import org.example.entity.Currency;
import org.example.entity.User;

import java.time.Instant;
import java.util.UUID;

public record UserDto(
        UUID id,
        String email,
        String name,
        Currency defaultCurrency,
        Instant createdAt
) {

    public static UserDto from(User user) {
        return new UserDto(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getDefaultCurrency(),
                user.getCreatedAt()
        );
    }
}

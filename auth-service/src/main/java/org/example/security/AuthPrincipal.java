package org.example.security;

import org.example.entity.SystemRole;

import java.util.UUID;

public record AuthPrincipal(UUID id, String email, SystemRole role) {
}

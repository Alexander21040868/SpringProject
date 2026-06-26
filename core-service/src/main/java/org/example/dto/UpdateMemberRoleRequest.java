package org.example.dto;

import jakarta.validation.constraints.NotNull;
import org.example.entity.Role;

public record UpdateMemberRoleRequest(

        @NotNull
        Role role
) {
}

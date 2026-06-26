package org.example.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.example.entity.Role;

public record CreateInvitationRequest(

        @NotBlank
        @Email
        String email,

        @NotNull
        Role role
) {
}

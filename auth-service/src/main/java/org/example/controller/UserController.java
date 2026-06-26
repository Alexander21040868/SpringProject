package org.example.controller;

import jakarta.validation.Valid;
import org.example.dto.UpdateUserRequest;
import org.example.dto.UserDto;
import org.example.security.AuthPrincipal;
import org.example.service.UserService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserDto getMe(@AuthenticationPrincipal AuthPrincipal principal) {
        return userService.getById(principal.id());
    }

    @PatchMapping("/me")
    public UserDto updateMe(@AuthenticationPrincipal AuthPrincipal principal,
                            @Valid @RequestBody UpdateUserRequest request) {
        return userService.update(principal.id(), request);
    }
}

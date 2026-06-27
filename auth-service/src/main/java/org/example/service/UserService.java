package org.example.service;

import org.example.dto.UpdateUserRequest;
import org.example.dto.UserDto;
import org.example.entity.User;
import org.example.exception.UserNotFoundException;
import org.example.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public UserDto getById(UUID id) {
        return UserDto.from(findOrThrow(id));
    }

    @Transactional(readOnly = true)
    public boolean existsByEmail(String email) {
        return email != null && userRepository.existsByEmail(User.normalizeEmail(email));
    }

    @Transactional
    public UserDto update(UUID id, UpdateUserRequest request) {
        User user = findOrThrow(id);
        if (request.name() != null) {
            user.setName(request.name());
        }
        if (request.defaultCurrency() != null) {
            user.setDefaultCurrency(request.defaultCurrency());
        }
        return UserDto.from(user);
    }

    private User findOrThrow(UUID id) {
        return userRepository.findById(id).orElseThrow(UserNotFoundException::new);
    }
}

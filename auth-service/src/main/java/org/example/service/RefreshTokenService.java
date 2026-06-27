package org.example.service;

import org.example.config.JwtProperties;
import org.example.entity.RefreshToken;
import org.example.entity.User;
import org.example.exception.InvalidTokenException;
import org.example.repository.RefreshTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final JwtProperties properties;
    private final SecureRandom secureRandom = new SecureRandom();

    public RefreshTokenService(RefreshTokenRepository repository, JwtProperties properties) {
        this.repository = repository;
        this.properties = properties;
    }

    @Transactional
    public String issue(User user) {
        String raw = generateRawToken();
        Instant expiresAt = Instant.now().plus(properties.refreshTtl());
        repository.save(new RefreshToken(user, hash(raw), expiresAt));
        return raw;
    }

    @Transactional
    public User rotate(String rawToken) {
        RefreshToken stored = repository.findByTokenHash(hash(rawToken))
                .orElseThrow(InvalidTokenException::new);

        if (stored.isRevoked()) {
            // Повторное предъявление уже ротированного токена — признак кражи/реиспользования.
            // Гасим всю семью токенов пользователя, чтобы инвалидировать и украденную ветку.
            repository.revokeAllByUser(stored.getUser());
            throw new InvalidTokenException();
        }
        if (!Instant.now().isBefore(stored.getExpiresAt())) {
            throw new InvalidTokenException();
        }
        // Атомарно гасим токен: 0 строк означает, что параллельный refresh уже его использовал.
        if (repository.revokeIfActive(stored.getId()) == 0) {
            repository.revokeAllByUser(stored.getUser());
            throw new InvalidTokenException();
        }
        return stored.getUser();
    }

    @Transactional
    public void revokeAll(User user) {
        repository.revokeAllByUser(user);
    }

    private String generateRawToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String raw) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 недоступен", e);
        }
    }
}

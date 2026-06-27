package org.example.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "auth-service")
public record AuthProperties(String baseUrl, Duration connectTimeout, Duration readTimeout) {
}

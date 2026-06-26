package org.example.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "core")
public record CoreProperties(String baseUrl, Duration connectTimeout, Duration readTimeout) {
}

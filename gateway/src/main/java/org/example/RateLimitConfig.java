package org.example;

import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.cloud.gateway.support.ipresolver.RemoteAddressResolver;
import org.springframework.cloud.gateway.support.ipresolver.XForwardedRemoteAddressResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import reactor.core.publisher.Mono;

@Configuration
public class RateLimitConfig {

    @Bean
    public KeyResolver ipKeyResolver() {
        RemoteAddressResolver resolver = XForwardedRemoteAddressResolver.maxTrustedIndex(1);
        return exchange -> {
            var address = resolver.resolve(exchange);
            String ip = address != null && address.getAddress() != null
                    ? address.getAddress().getHostAddress()
                    : "unknown";
            return Mono.just(ip);
        };
    }
}

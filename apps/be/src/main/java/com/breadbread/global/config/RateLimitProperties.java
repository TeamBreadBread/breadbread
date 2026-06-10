package com.breadbread.global.config;

import java.util.List;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "rate-limit")
public class RateLimitProperties {

    private List<Rule> rules = List.of();

    @Getter
    @Setter
    public static class Rule {
        private String method;
        private List<String> uris;
        private long ttlSeconds;
        private long maxRequests;
    }
}

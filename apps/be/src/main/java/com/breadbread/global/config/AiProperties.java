package com.breadbread.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "ai")
public class AiProperties {
    private String webhookUrl;
    private long webhookTimeoutSeconds;
    private long jobTtlHours;
}

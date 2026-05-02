package com.breadbread.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "coolsms.api")
public class CoolSmsProperties {
    private String key;
    private String secret;
    private String sender;
    private long expiresIn;
}

package com.breadbread.auth.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Getter
@Setter
@Configuration
@ConfigurationProperties(prefix = "phone-verification")
public class PhoneVerificationProperties {
    private long codeExpiresIn;
    private long tokenExpiresIn;
}

package com.breadbread.course.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "naver.maps")
public class NaverMapsProperties {
    private String clientId;
    private String clientSecret;
    private String baseUrl = "https://maps.apigw.ntruss.com";
    private long timeoutSeconds = 10;
}

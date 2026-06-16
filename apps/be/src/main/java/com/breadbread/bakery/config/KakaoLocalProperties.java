package com.breadbread.bakery.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "kakao.local")
public class KakaoLocalProperties {
    private String apiKey = "";
    private String baseUrl = "https://dapi.kakao.com";
}

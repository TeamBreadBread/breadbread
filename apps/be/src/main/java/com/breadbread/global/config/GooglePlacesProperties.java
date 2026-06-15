package com.breadbread.global.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "google.places")
public class GooglePlacesProperties {
    private String apiKey = "";
    private String baseUrl = "https://places.googleapis.com";
    private long photoUrlTtlSeconds = 345600; // 4일
}

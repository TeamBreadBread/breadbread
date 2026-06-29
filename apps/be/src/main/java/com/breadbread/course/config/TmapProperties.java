package com.breadbread.course.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "tmap")
public class TmapProperties {

    private String appKey;
    private String baseUrl = "https://apis.openapi.sk.com";
    private long timeoutSeconds = 10;
}

package com.breadbread.course.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "kakao.mobility")
public class KakaoMobilityProperties {

    private String appKey;
    private String baseUrl = "https://apis-navi.kakaomobility.com";
    private long timeoutSeconds = 10;
}

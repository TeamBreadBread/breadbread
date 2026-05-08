package com.breadbread.payment.config;

import com.breadbread.payment.client.PortOneClient;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
@RequiredArgsConstructor
public class PortOneClientConfig {
    private final PortOneProperties properties;

    @Bean
    public PortOneClient portOneClient() {
        WebClient http =
                WebClient.builder()
                        .baseUrl(properties.getApiBaseUrl())
                        .defaultHeader(
                                HttpHeaders.AUTHORIZATION, "PortOne " + properties.getApiSecret())
                        .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                        .build();
        return new PortOneClient(http);
    }
}

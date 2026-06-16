package com.breadbread.bakery.client;

import com.breadbread.bakery.config.KakaoLocalProperties;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Duration;
import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;

@Slf4j
@Component
@RequiredArgsConstructor
public class KakaoLocalClient {

    private static final int MAX_SIZE = 15;

    private final WebClient webClient;
    private final KakaoLocalProperties properties;

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class KeywordSearchResponse {
        private List<Place> documents;
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Place {
        @JsonProperty("place_name")
        private String placeName;

        @JsonProperty("road_address_name")
        private String roadAddressName;

        @JsonProperty("address_name")
        private String addressName;

        private String phone;
        private String x; // longitude
        private String y; // latitude

        @JsonProperty("category_name")
        private String categoryName;

        @JsonProperty("place_url")
        private String placeUrl;
    }

    public List<Place> searchBakeries(String keyword) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            log.warn("[카카오 로컬] API 키가 설정되지 않아 요청을 건너뜁니다.");
            return List.of();
        }

        try {
            KeywordSearchResponse response =
                    webClient
                            .get()
                            .uri(
                                    properties.getBaseUrl()
                                            + "/v2/local/search/keyword.json?query={query}&size={size}",
                                    keyword,
                                    MAX_SIZE)
                            .header("Authorization", "KakaoAK " + properties.getApiKey())
                            .retrieve()
                            .bodyToMono(KeywordSearchResponse.class)
                            .timeout(Duration.ofSeconds(10))
                            .block();

            if (response == null || response.getDocuments() == null) return List.of();
            return response.getDocuments();
        } catch (Exception e) {
            log.error("[카카오 로컬] 키워드 검색 실패: keyword={}", keyword, e);
            return List.of();
        }
    }
}

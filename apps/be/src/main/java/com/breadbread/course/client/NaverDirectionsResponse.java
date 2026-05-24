package com.breadbread.course.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
class NaverDirectionsResponse {

    private int code;
    private String message;
    private RouteData route;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class RouteData {
        private List<TraoptimalRoute> traoptimal;
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class TraoptimalRoute {
        private Summary summary;
        private List<double[]> path; // 각 원소: [경도(lng), 위도(lat)]
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Summary {
        /** 총 이동 시간 (밀리초). */
        private long duration;
    }
}

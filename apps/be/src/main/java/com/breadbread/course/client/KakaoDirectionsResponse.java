package com.breadbread.course.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
class KakaoDirectionsResponse {

    private List<Route> routes;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Route {

        @JsonProperty("result_code")
        private int resultCode;

        @JsonProperty("result_msg")
        private String resultMsg;

        private Summary summary;

        private List<Section> sections;
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Summary {
        // 총 이동 시간 (초)
        private int duration;
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Section {
        // 구간 이동 시간 (초).
        private int duration;

        private List<Road> roads;
    }

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class Road {

        // flat array: [경도1, 위도1, 경도2, 위도2, ...]
        private double[] vertexes;
    }
}

package com.breadbread.course.client;

import com.breadbread.course.config.TmapProperties;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class TmapMatrixClient {

    private static final String MATRIX_PATH = "/tmap/matrix";

    private final WebClient webClient;
    private final TmapProperties properties;

    /**
     * origins[0] = 출발지, origins[1..N] = 빵집들 destinations[0..N-1] = 빵집들 반환: matrix[i][j] =
     * origins[i] → destinations[j] 이동시간(초), 실패 시 Integer.MAX_VALUE
     */
    public int[][] getMatrix(
            List<double[]> origins, List<double[]> destinations, String transportMode) {
        int m = origins.size();
        int n = destinations.size();

        Map<String, Object> body = buildRequestBody(origins, destinations, transportMode);

        log.info("[Tmap Matrix] 요청: origins={}, destinations={}", m, n);
        long startTime = System.currentTimeMillis();
        TmapMatrixResponse response = callApi(body);
        log.info("[Tmap Matrix] 완료: elapsed={}ms", System.currentTimeMillis() - startTime);

        int[][] matrix = new int[m][n];
        List<TmapMatrixResponse.MatrixResult> results = response.getResultList();
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                int idx = i * n + j;
                matrix[i][j] =
                        (results != null && idx < results.size() && results.get(idx) != null)
                                ? results.get(idx).getTime()
                                : Integer.MAX_VALUE;
            }
        }
        return matrix;
    }

    private Map<String, Object> buildRequestBody(
            List<double[]> origins, List<double[]> destinations, String transportMode) {
        List<Map<String, Object>> startList = new ArrayList<>();
        for (int i = 0; i < origins.size(); i++) {
            double[] o = origins.get(i);
            Map<String, Object> start = new HashMap<>();
            start.put("startX", String.valueOf(o[1])); // lng
            start.put("startY", String.valueOf(o[0])); // lat
            start.put("startName", "s" + i);
            startList.add(start);
        }

        List<Map<String, Object>> endList = new ArrayList<>();
        for (int j = 0; j < destinations.size(); j++) {
            double[] d = destinations.get(j);
            Map<String, Object> end = new HashMap<>();
            end.put("endX", String.valueOf(d[1])); // lng
            end.put("endY", String.valueOf(d[0])); // lat
            end.put("endName", "e" + j);
            endList.add(end);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("startList", startList);
        body.put("endList", endList);
        body.put("transportMode", transportMode);
        return body;
    }

    private TmapMatrixResponse callApi(Map<String, Object> body) {
        TmapMatrixResponse response =
                webClient
                        .post()
                        .uri(
                                uriBuilder ->
                                        uriBuilder
                                                .scheme("https")
                                                .host("apis.openapi.sk.com")
                                                .path(MATRIX_PATH)
                                                .queryParam("version", "1")
                                                .build())
                        .header("appKey", properties.getAppKey())
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(body)
                        .retrieve()
                        .onStatus(HttpStatusCode::isError, this::handleErrorResponse)
                        .bodyToMono(TmapMatrixResponse.class)
                        .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                        .block();

        if (response == null) {
            throw new RuntimeException("TMAP matrix 응답 없음");
        }
        return response;
    }

    private Mono<Throwable> handleErrorResponse(ClientResponse res) {
        return res.bodyToMono(String.class)
                .flatMap(
                        body -> {
                            log.error(
                                    "[Tmap Matrix] HTTP 오류: status={}, body={}",
                                    res.statusCode(),
                                    body);
                            return Mono.error(
                                    new RuntimeException(
                                            "TMAP matrix HTTP 오류: " + res.statusCode()));
                        });
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class TmapMatrixResponse {
        private List<MatrixResult> resultList;

        @Getter
        @JsonIgnoreProperties(ignoreUnknown = true)
        static class MatrixResult {
            private int time;
            private int distance;
        }
    }
}

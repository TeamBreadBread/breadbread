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

        return parseMatrix(response, m, n);
    }

    private Map<String, Object> buildRequestBody(
            List<double[]> origins, List<double[]> destinations, String transportMode) {
        List<Map<String, Object>> originList = new ArrayList<>();
        for (double[] o : origins) {
            Map<String, Object> point = new HashMap<>();
            point.put("lon", String.valueOf(o[1])); // lng
            point.put("lat", String.valueOf(o[0])); // lat
            originList.add(point);
        }

        List<Map<String, Object>> destinationList = new ArrayList<>();
        for (double[] d : destinations) {
            Map<String, Object> point = new HashMap<>();
            point.put("lon", String.valueOf(d[1])); // lng
            point.put("lat", String.valueOf(d[0])); // lat
            destinationList.add(point);
        }

        Map<String, Object> body = new HashMap<>();
        body.put("origins", originList);
        body.put("destinations", destinationList);
        body.put("transportMode", transportMode);
        return body;
    }

    private TmapMatrixResponse callApi(Map<String, Object> body) {
        TmapMatrixResponse response =
                webClient
                        .post()
                        .uri(properties.getBaseUrl() + MATRIX_PATH + "?version=1")
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

    int[][] parseMatrix(TmapMatrixResponse response, int m, int n) {
        int[][] matrix = new int[m][n];
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                matrix[i][j] = Integer.MAX_VALUE;
            }
        }
        List<TmapMatrixResponse.MatrixRoute> routes = response.getMatrixRoutes();
        if (routes != null) {
            for (TmapMatrixResponse.MatrixRoute r : routes) {
                int oi = r.getOriginIndex();
                int di = r.getDestinationIndex();
                if (oi >= 0 && oi < m && di >= 0 && di < n) {
                    matrix[oi][di] = r.getDuration();
                }
            }
        }
        return matrix;
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
        private List<MatrixRoute> matrixRoutes;

        @Getter
        @JsonIgnoreProperties(ignoreUnknown = true)
        static class MatrixRoute {
            private int originIndex;
            private int destinationIndex;
            private int duration;
            private double distance;
        }
    }
}

package com.breadbread.course.client;

import com.breadbread.course.config.TmapProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.exception.TransientApiException;
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
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
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
    @Retryable(
            retryFor = TransientApiException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 300, multiplier = 2))
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
        try {
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
                log.error("[Tmap Matrix] 응답 body 없음");
                throw new TransientApiException(
                        ErrorCode.ROUTE_PROVIDER_ERROR, "Tmap Matrix 응답 body 없음", null);
            }
            return response;

        } catch (CustomException | TransientApiException e) {
            throw e;
        } catch (Exception e) {
            if (reactor.core.Exceptions.unwrap(e)
                    instanceof java.util.concurrent.TimeoutException) {
                log.error("[Tmap Matrix] 타임아웃: timeoutSeconds={}", properties.getTimeoutSeconds());
                throw new TransientApiException(
                        ErrorCode.ROUTE_PROVIDER_ERROR, "Tmap Matrix 타임아웃", e);
            }
            log.error("[Tmap Matrix] API 호출 실패: {}", e.toString());
            throw new TransientApiException(ErrorCode.ROUTE_PROVIDER_ERROR, "Tmap Matrix 호출 실패", e);
        }
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
                            if (res.statusCode().is5xxServerError()) {
                                return Mono.error(
                                        new TransientApiException(
                                                ErrorCode.ROUTE_PROVIDER_ERROR,
                                                "Tmap Matrix 서버 오류: " + res.statusCode(),
                                                null));
                            }
                            return Mono.error(new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR));
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

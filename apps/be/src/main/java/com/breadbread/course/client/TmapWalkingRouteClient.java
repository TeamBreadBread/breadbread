package com.breadbread.course.client;

import com.breadbread.course.config.TmapProperties;
import com.breadbread.course.dto.route.Coordinate;
import com.breadbread.course.dto.route.RouteResult;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.JsonNode;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
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
public class TmapWalkingRouteClient implements WalkingRouteClient {

    private static final String PEDESTRIAN_PATH = "/tmap/routes/pedestrian";

    private final WebClient webClient;
    private final TmapProperties properties;

    @Override
    public RouteResult getPath(List<Coordinate> coordinates) {
        Coordinate start = coordinates.get(0);
        Coordinate end = coordinates.get(coordinates.size() - 1);
        List<Coordinate> waypoints = coordinates.subList(1, coordinates.size() - 1);

        Map<String, Object> body = buildRequestBody(start, end, waypoints);

        log.info(
                "[Tmap 경로] 요청: totalPoints={}, waypointCount={}",
                coordinates.size(),
                waypoints.size());

        long startTime = System.currentTimeMillis();
        TmapRouteResponse response = callApi(body);
        log.info("[Tmap 경로] 완료: elapsed={}ms", System.currentTimeMillis() - startTime);

        return toRouteResult(response, end);
    }

    private Map<String, Object> buildRequestBody(
            Coordinate start, Coordinate end, List<Coordinate> waypoints) {
        Map<String, Object> body = new HashMap<>();
        body.put("startX", String.valueOf(start.getLng()));
        body.put("startY", String.valueOf(start.getLat()));
        body.put("endX", String.valueOf(end.getLng()));
        body.put("endY", String.valueOf(end.getLat()));
        body.put("startName", "출발지");
        body.put("endName", "도착지");
        body.put("searchOption", "10");
        body.put("sort", "custom");

        if (!waypoints.isEmpty()) {
            String passList =
                    waypoints.stream()
                            .map(w -> w.getLng() + "," + w.getLat())
                            .collect(Collectors.joining("_"));
            body.put("passList", passList);
        }

        return body;
    }

    private TmapRouteResponse callApi(Map<String, Object> body) {
        try {
            TmapRouteResponse response =
                    webClient
                            .post()
                            .uri(
                                    uriBuilder ->
                                            uriBuilder
                                                    .scheme("https")
                                                    .host("apis.openapi.sk.com")
                                                    .path(PEDESTRIAN_PATH)
                                                    .queryParam("version", "1")
                                                    .build())
                            .header("appKey", properties.getAppKey())
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(body)
                            .retrieve()
                            .onStatus(HttpStatusCode::isError, this::handleErrorResponse)
                            .bodyToMono(TmapRouteResponse.class)
                            .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                            .block();

            if (response == null) {
                log.error("[Tmap 경로] 응답 body 없음");
                throw new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR);
            }
            return response;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            if (reactor.core.Exceptions.unwrap(e)
                    instanceof java.util.concurrent.TimeoutException) {
                log.error("[Tmap 경로] 타임아웃: timeoutSeconds={}", properties.getTimeoutSeconds());
            } else {
                log.error("[Tmap 경로] API 호출 실패", e);
            }
            throw new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR);
        }
    }

    private Mono<Throwable> handleErrorResponse(ClientResponse res) {
        return res.bodyToMono(String.class)
                .flatMap(
                        body -> {
                            log.error(
                                    "[Tmap 경로] HTTP 오류: status={}, body={}",
                                    res.statusCode(),
                                    body);
                            return Mono.error(new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR));
                        });
    }

    private RouteResult toRouteResult(TmapRouteResponse response, Coordinate destination) {
        if (response.getFeatures() == null || response.getFeatures().isEmpty()) {
            log.error("[Tmap 경로] features 없음");
            throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
        }

        int totalDurationSeconds = 0;
        List<Coordinate> path = new ArrayList<>();

        for (TmapRouteResponse.Feature feature : response.getFeatures()) {
            JsonNode geometry = feature.getGeometry();
            if (geometry == null) continue;

            String geometryType = geometry.path("type").asText();

            if ("Point".equals(geometryType) && totalDurationSeconds == 0) {
                // 첫 번째 Point(SP)에서 totalTime 추출
                JsonNode props = feature.getProperties();
                if (props != null && props.has("totalTime")) {
                    totalDurationSeconds = props.path("totalTime").asInt();
                }
            } else if ("LineString".equals(geometryType)) {
                JsonNode coords = geometry.path("coordinates");
                if (coords.isArray()) {
                    for (JsonNode point : coords) {
                        double lng = point.get(0).asDouble();
                        double lat = point.get(1).asDouble();
                        path.add(new Coordinate(lat, lng));
                    }
                }
            }
        }

        if (path.isEmpty()) {
            log.error("[Tmap 경로] path 좌표 없음");
            throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
        }

        Coordinate last = path.get(path.size() - 1);
        if (Math.abs(last.getLat() - destination.getLat()) > 1e-6
                || Math.abs(last.getLng() - destination.getLng()) > 1e-6) {
            path.add(destination);
        }

        log.info(
                "[Tmap 경로] 응답 수신: pathPoints={}, totalSeconds={}",
                path.size(),
                totalDurationSeconds);

        // T맵 단일 요청에서는 구간별 시간을 제공하지 않으므로 빈 리스트
        return new RouteResult(path, List.of(), totalDurationSeconds);
    }

    @Getter
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class TmapRouteResponse {

        private List<Feature> features;

        @Getter
        @JsonIgnoreProperties(ignoreUnknown = true)
        static class Feature {
            private JsonNode geometry;
            private JsonNode properties;
        }
    }
}

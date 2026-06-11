package com.breadbread.course.client;

import com.breadbread.course.config.KakaoMobilityProperties;
import com.breadbread.course.dto.route.Coordinate;
import com.breadbread.course.dto.route.RouteResult;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.net.URI;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "route.provider", havingValue = "kakao")
public class KakaoDrivingRouteClient implements DrivingRouteClient {

    private static final String CAR_PATH = "/v1/directions";

    private final WebClient webClient;
    private final KakaoMobilityProperties properties;

    @Override
    public RouteResult getPath(List<Coordinate> coordinates) {
        Coordinate origin = coordinates.get(0);
        Coordinate destination = coordinates.get(coordinates.size() - 1);
        List<Coordinate> waypoints = coordinates.subList(1, coordinates.size() - 1);

        String url = buildUrl(origin, destination, waypoints);

        log.info(
                "[Kakao 경로] 요청: totalPoints={}, waypointCount={}",
                coordinates.size(),
                waypoints.size());

        long startTime = System.currentTimeMillis();
        KakaoDirectionsResponse response = callApi(url);
        log.info("[Kakao 경로] 완료: elapsed={}ms", System.currentTimeMillis() - startTime);

        return toRouteResult(response, destination);
    }

    private String buildUrl(Coordinate origin, Coordinate destination, List<Coordinate> waypoints) {
        StringBuilder sb =
                new StringBuilder()
                        .append(properties.getBaseUrl())
                        .append(CAR_PATH)
                        .append("?origin=")
                        .append(toParam(origin))
                        .append("&destination=")
                        .append(toParam(destination));

        if (!waypoints.isEmpty()) {
            String waypointsParam =
                    waypoints.stream().map(this::toParam).collect(Collectors.joining("%7C"));
            sb.append("&waypoints=").append(waypointsParam);
        }

        sb.append("&priority=RECOMMEND");
        return sb.toString();
    }

    private KakaoDirectionsResponse callApi(String url) {
        try {
            KakaoDirectionsResponse response =
                    webClient
                            .get()
                            .uri(URI.create(url))
                            .header("Authorization", "KakaoAK " + properties.getAppKey())
                            .retrieve()
                            .onStatus(
                                    HttpStatusCode::isError,
                                    res ->
                                            res.bodyToMono(String.class)
                                                    .flatMap(
                                                            body -> {
                                                                log.error(
                                                                        "[Kakao 경로] HTTP 오류: status={}, body={}",
                                                                        res.statusCode(),
                                                                        body);
                                                                return Mono.error(
                                                                        new CustomException(
                                                                                ErrorCode
                                                                                        .ROUTE_PROVIDER_ERROR));
                                                            }))
                            .bodyToMono(KakaoDirectionsResponse.class)
                            .timeout(Duration.ofSeconds(properties.getTimeoutSeconds()))
                            .block();

            if (response == null) {
                log.error("[Kakao 경로] 응답 body 없음");
                throw new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR);
            }
            return response;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            if (reactor.core.Exceptions.unwrap(e)
                    instanceof java.util.concurrent.TimeoutException) {
                log.error("[Kakao 경로] 타임아웃: timeoutSeconds={}", properties.getTimeoutSeconds());
            } else {
                log.error("[Kakao 경로] API 호출 실패", e);
            }
            throw new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR);
        }
    }

    private RouteResult toRouteResult(KakaoDirectionsResponse response, Coordinate destination) {
        if (response.getRoutes() == null || response.getRoutes().isEmpty()) {
            log.error("[Kakao 경로] routes 없음");
            throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
        }

        KakaoDirectionsResponse.Route route = response.getRoutes().get(0);
        if (route.getResultCode() != 0) {
            log.error(
                    "[Kakao 경로] 경로 없음: code={}, message={}",
                    route.getResultCode(),
                    route.getResultMsg());
            throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
        }

        // 구간별 이동 시간 (초)
        List<Integer> legDurationsSeconds =
                route.getSections() == null
                        ? List.of()
                        : route.getSections().stream()
                                .map(KakaoDirectionsResponse.Section::getDuration)
                                .collect(Collectors.toList());

        // 총 이동 시간 (초) - summary에서 가져오되 없으면 구간 합산으로 fallback
        int totalDurationSeconds =
                route.getSummary() != null
                        ? route.getSummary().getDuration()
                        : legDurationsSeconds.stream().mapToInt(Integer::intValue).sum();

        // 경로 좌표 추출
        List<Coordinate> path = new ArrayList<>();
        if (route.getSections() != null) {
            for (KakaoDirectionsResponse.Section section : route.getSections()) {
                if (section.getRoads() == null) continue;
                for (KakaoDirectionsResponse.Road road : section.getRoads()) {
                    double[] vertexes = road.getVertexes();
                    if (vertexes == null) continue;
                    // vertexes: flat array [lng1, lat1, lng2, lat2, ...]
                    for (int i = 0; i + 1 < vertexes.length; i += 2) {
                        path.add(new Coordinate(vertexes[i + 1], vertexes[i]));
                    }
                }
            }
        }

        if (path.isEmpty()) {
            throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
        }

        // Kakao road vertexes가 destination 좌표까지 포함하지 않는 경우 보정
        Coordinate last = path.get(path.size() - 1);
        if (Math.abs(last.getLat() - destination.getLat()) > 1e-6
                || Math.abs(last.getLng() - destination.getLng()) > 1e-6) {
            path.add(destination);
        }

        log.info(
                "[Kakao 경로] 응답 수신: pathPoints={}, sections={}",
                path.size(),
                legDurationsSeconds.size());
        return new RouteResult(path, legDurationsSeconds, totalDurationSeconds);
    }

    // Kakao API 파라미터 형식: 경도,위도 (lng,lat)
    private String toParam(Coordinate c) {
        return c.getLng() + "," + c.getLat();
    }
}

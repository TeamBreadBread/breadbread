package com.breadbread.course.client;

import com.breadbread.course.config.NaverMapsProperties;
import com.breadbread.course.dto.Coordinate;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.net.URI;
import java.time.Duration;
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
@ConditionalOnProperty(name = "route.provider", havingValue = "naver", matchIfMissing = true)
public class NaverDrivingRouteClient implements DrivingRouteClient {

    private static final String DIRECTIONS_PATH = "/map-direction/v1/driving";

    private final WebClient client;
    private final NaverMapsProperties naverMapsProperties;

    @Override
    public List<Coordinate> getPath(List<Coordinate> coordinates) {
        Coordinate start = coordinates.get(0);
        Coordinate goal = coordinates.get(coordinates.size() - 1);
        List<Coordinate> waypoints = coordinates.subList(1, coordinates.size() - 1);

        String startParam = toParam(start);
        String goalParam = toParam(goal);
        String url = buildUrl(startParam, goalParam, waypoints);

        log.info(
                "[Naver 경로] 요청: totalPoints={}, waypointCount={}",
                coordinates.size(),
                waypoints.size());

        long startTime = System.currentTimeMillis();
        NaverDirectionsResponse response = callApi(url);
        log.info("[Naver 경로] 완료: elapsed={}ms", System.currentTimeMillis() - startTime);

        return toCoordinates(response);
    }

    private String buildUrl(String startParam, String goalParam, List<Coordinate> waypoints) {
        StringBuilder sb =
                new StringBuilder()
                        .append(naverMapsProperties.getBaseUrl())
                        .append(DIRECTIONS_PATH)
                        .append("?start=")
                        .append(startParam)
                        .append("&goal=")
                        .append(goalParam)
                        .append("&option=traoptimal");

        if (!waypoints.isEmpty()) {
            String waypointsParam =
                    waypoints.stream().map(this::toParam).collect(Collectors.joining("%7C"));
            sb.append("&waypoints=").append(waypointsParam);
        }
        return sb.toString();
    }

    private NaverDirectionsResponse callApi(String url) {
        try {
            NaverDirectionsResponse response =
                    client.get()
                            .uri(URI.create(url))
                            .header("X-NCP-APIGW-API-KEY-ID", naverMapsProperties.getClientId())
                            .header("X-NCP-APIGW-API-KEY", naverMapsProperties.getClientSecret())
                            .retrieve()
                            .onStatus(
                                    HttpStatusCode::isError,
                                    res ->
                                            res.bodyToMono(String.class)
                                                    .flatMap(
                                                            body -> {
                                                                log.error(
                                                                        "[Naver 경로] HTTP 오류: status={}, body={}",
                                                                        res.statusCode(),
                                                                        body);
                                                                return Mono.error(
                                                                        new CustomException(
                                                                                ErrorCode
                                                                                        .ROUTE_PROVIDER_ERROR));
                                                            }))
                            .bodyToMono(NaverDirectionsResponse.class)
                            .timeout(Duration.ofSeconds(naverMapsProperties.getTimeoutSeconds()))
                            .block();

            if (response == null) {
                log.error("[Naver 경로] 응답 body 없음");
                throw new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR);
            }
            return response;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            if (reactor.core.Exceptions.unwrap(e)
                    instanceof java.util.concurrent.TimeoutException) {
                log.error(
                        "[Naver 경로] 타임아웃: timeoutSeconds={}",
                        naverMapsProperties.getTimeoutSeconds());
            } else {
                log.error("[Naver 경로] API 호출 실패", e);
            }
            throw new CustomException(ErrorCode.ROUTE_PROVIDER_ERROR);
        }
    }

    private List<Coordinate> toCoordinates(NaverDirectionsResponse response) {
        if (response.getRoute() == null
                || response.getRoute().getTraoptimal() == null
                || response.getRoute().getTraoptimal().isEmpty()) {
            log.error(
                    "[Naver 경로] 경로 없음: code={}, message={}",
                    response.getCode(),
                    response.getMessage());
            throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
        }

        List<double[]> path = response.getRoute().getTraoptimal().get(0).getPath();
        if (path == null || path.isEmpty()) {
            throw new CustomException(ErrorCode.ROUTE_NOT_FOUND);
        }

        log.info("[Naver 경로] 응답 수신: pathPoints={}", path.size());

        // Naver 응답은 [경도(lng), 위도(lat)] 순서 → Coordinate(lat, lng)로 변환
        return path.stream()
                .map(point -> new Coordinate(point[1], point[0]))
                .toList(); // Coordinate(lat, lng)
    }

    // Naver API 파라미터 형식: 경도,위도 (lng,lat)
    private String toParam(Coordinate c) {
        return c.getLng() + "," + c.getLat();
    }
}

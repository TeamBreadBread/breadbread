package com.breadbread.course.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.breadbread.course.config.NaverMapsProperties;
import com.breadbread.course.dto.Coordinate;
import com.breadbread.course.dto.RouteResult;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

@ExtendWith(MockitoExtension.class)
class NaverDrivingRouteClientTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient webClient;

    private NaverMapsProperties properties;
    private NaverDrivingRouteClient client;

    @BeforeEach
    void setUp() {
        properties = new NaverMapsProperties();
        properties.setClientId("test-id");
        properties.setClientSecret("test-secret");
        properties.setBaseUrl("https://maps.apigw.ntruss.com");
        properties.setTimeoutSeconds(10);
        client = new NaverDrivingRouteClient(webClient, properties);
    }

    // ── toParam ────────────────────────────────────────────────────────────────

    @Test
    void toParam_returns_lng_comma_lat() {
        Coordinate c = new Coordinate(37.5, 127.0); // lat=37.5, lng=127.0
        String param = (String) ReflectionTestUtils.invokeMethod(client, "toParam", c);
        assertThat(param).isEqualTo("127.0,37.5");
    }

    // ── buildUrl ───────────────────────────────────────────────────────────────

    @Test
    void buildUrl_noWaypoints_omitsWaypointsParam() {
        String url =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                client, "buildUrl", "127.0,37.5", "128.0,35.1", List.of());

        assertThat(url).startsWith("https://maps.apigw.ntruss.com/map-direction/v1/driving");
        assertThat(url).contains("start=127.0,37.5");
        assertThat(url).contains("goal=128.0,35.1");
        assertThat(url).contains("option=traoptimal");
        assertThat(url).doesNotContain("waypoints");
    }

    @Test
    void buildUrl_withWaypoints_joinsWithEncodedPipe() {
        List<Coordinate> waypoints =
                List.of(new Coordinate(36.0, 127.5), new Coordinate(35.5, 129.0));

        String url =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                client, "buildUrl", "127.0,37.5", "128.0,35.1", waypoints);

        assertThat(url).contains("waypoints=127.5,36.0%7C129.0,35.5");
    }

    // ── toCoordinates ──────────────────────────────────────────────────────────

    @Test
    void toRouteResult_swapsLngLat_fromNaverFormat() {
        // Naver path format: [lng, lat]
        NaverDirectionsResponse response =
                buildResponse(List.of(new double[] {127.1, 37.4}, new double[] {127.2, 37.5}));

        RouteResult result = ReflectionTestUtils.invokeMethod(client, "toRouteResult", response);
        List<Coordinate> coords = result.getPath();

        assertThat(coords).hasSize(2);
        // first point: lng=127.1, lat=37.4 → Coordinate(lat=37.4, lng=127.1)
        assertThat(coords.get(0).getLat()).isEqualTo(37.4);
        assertThat(coords.get(0).getLng()).isEqualTo(127.1);
        // second point
        assertThat(coords.get(1).getLat()).isEqualTo(37.5);
        assertThat(coords.get(1).getLng()).isEqualTo(127.2);
    }

    @Test
    void toRouteResult_throws_whenRouteIsNull() {
        NaverDirectionsResponse response = new NaverDirectionsResponse();
        // route is null by default

        assertThatThrownBy(
                        () -> ReflectionTestUtils.invokeMethod(client, "toRouteResult", response))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);
    }

    @Test
    void toRouteResult_throws_whenTraoptimalIsEmpty() {
        NaverDirectionsResponse response = buildResponse(null);
        ReflectionTestUtils.setField(response.getRoute(), "traoptimal", List.of());

        assertThatThrownBy(
                        () -> ReflectionTestUtils.invokeMethod(client, "toRouteResult", response))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);
    }

    @Test
    void toRouteResult_throws_whenPathIsEmpty() {
        NaverDirectionsResponse response = buildResponse(List.of()); // empty path

        assertThatThrownBy(
                        () -> ReflectionTestUtils.invokeMethod(client, "toRouteResult", response))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    /**
     * Builds a NaverDirectionsResponse with one traoptimal route containing the given path. Pass
     * {@code null} for path to get a response with no traoptimal list at all.
     */
    private NaverDirectionsResponse buildResponse(List<double[]> path) {
        NaverDirectionsResponse response = new NaverDirectionsResponse();
        NaverDirectionsResponse.RouteData routeData = new NaverDirectionsResponse.RouteData();

        if (path != null) {
            NaverDirectionsResponse.TraoptimalRoute route =
                    new NaverDirectionsResponse.TraoptimalRoute();
            ReflectionTestUtils.setField(route, "path", path);
            ReflectionTestUtils.setField(routeData, "traoptimal", List.of(route));
        }

        ReflectionTestUtils.setField(response, "route", routeData);
        return response;
    }
}

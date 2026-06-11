package com.breadbread.course.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.breadbread.course.config.KakaoMobilityProperties;
import com.breadbread.course.dto.route.Coordinate;
import com.breadbread.course.dto.route.RouteResult;
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
class KakaoDrivingRouteClientTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient webClient;

    private KakaoMobilityProperties properties;
    private KakaoDrivingRouteClient client;

    @BeforeEach
    void setUp() {
        properties = new KakaoMobilityProperties();
        properties.setAppKey("test-key");
        properties.setBaseUrl("https://apis-navi.kakaomobility.com");
        properties.setTimeoutSeconds(10);
        client = new KakaoDrivingRouteClient(webClient, properties);
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
        Coordinate origin = new Coordinate(37.5, 127.0);
        Coordinate destination = new Coordinate(35.1, 128.0);

        String url =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                client, "buildUrl", origin, destination, List.of());

        assertThat(url).startsWith("https://apis-navi.kakaomobility.com/v1/directions");
        assertThat(url).contains("origin=127.0,37.5");
        assertThat(url).contains("destination=128.0,35.1");
        assertThat(url).contains("priority=RECOMMEND");
        assertThat(url).doesNotContain("waypoints");
    }

    @Test
    void buildUrl_withWaypoints_joinsWithEncodedPipe() {
        Coordinate origin = new Coordinate(37.5, 127.0);
        Coordinate destination = new Coordinate(35.1, 128.0);
        List<Coordinate> waypoints =
                List.of(new Coordinate(36.0, 127.5), new Coordinate(35.5, 129.0));

        String url =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                client, "buildUrl", origin, destination, waypoints);

        assertThat(url).contains("waypoints=127.5,36.0%7C129.0,35.5");
    }

    // ── toRouteResult ──────────────────────────────────────────────────────────

    @Test
    void toRouteResult_extractsPath_andLegDurations_andTotalDuration() {
        // section1: lng=127.0,lat=37.0 → lng=127.1,lat=37.1 / duration=300
        // section2: lng=127.1,lat=37.1 → lng=127.2,lat=37.2 / duration=120
        KakaoDirectionsResponse.Section s1 =
                buildSection(300, new double[] {127.0, 37.0, 127.1, 37.1});
        KakaoDirectionsResponse.Section s2 =
                buildSection(120, new double[] {127.1, 37.1, 127.2, 37.2});
        KakaoDirectionsResponse.Summary summary = buildSummary(600);
        KakaoDirectionsResponse response = buildResponse(0, List.of(s1, s2), summary);
        // destination이 마지막 vertex와 일치 → 추가 좌표 없음
        Coordinate destination = new Coordinate(37.2, 127.2);

        RouteResult result =
                (RouteResult)
                        ReflectionTestUtils.invokeMethod(
                                client, "toRouteResult", response, destination);

        // 좌표: vertexes [lng, lat] → Coordinate(lat, lng)
        assertThat(result.getPath()).hasSize(4);
        assertThat(result.getPath().get(0).getLat()).isEqualTo(37.0);
        assertThat(result.getPath().get(0).getLng()).isEqualTo(127.0);
        assertThat(result.getPath().get(3).getLat()).isEqualTo(37.2);
        assertThat(result.getPath().get(3).getLng()).isEqualTo(127.2);

        // 구간별 이동 시간
        assertThat(result.getLegDurationsSeconds()).containsExactly(300, 120);

        // 총 이동 시간은 summary에서
        assertThat(result.getTotalDurationSeconds()).isEqualTo(600);
    }

    @Test
    void toRouteResult_appendsDestination_whenLastVertexDiffers() {
        // vertexes가 destination까지 포함하지 않는 경우 destination 좌표가 path 끝에 추가되어야 함
        KakaoDirectionsResponse.Section s1 =
                buildSection(300, new double[] {127.0, 37.0, 127.1, 37.1});
        KakaoDirectionsResponse.Summary summary = buildSummary(300);
        KakaoDirectionsResponse response = buildResponse(0, List.of(s1), summary);
        Coordinate destination = new Coordinate(37.9, 128.9); // 마지막 vertex와 다름

        RouteResult result =
                (RouteResult)
                        ReflectionTestUtils.invokeMethod(
                                client, "toRouteResult", response, destination);

        assertThat(result.getPath()).hasSize(3); // 기존 2개 + destination 1개
        Coordinate last = result.getPath().get(result.getPath().size() - 1);
        assertThat(last.getLat()).isEqualTo(37.9);
        assertThat(last.getLng()).isEqualTo(128.9);
    }

    @Test
    void toRouteResult_throws_whenRoutesNull() {
        KakaoDirectionsResponse response = new KakaoDirectionsResponse();
        Coordinate destination = new Coordinate(37.5, 127.0);

        assertThatThrownBy(
                        () ->
                                ReflectionTestUtils.invokeMethod(
                                        client, "toRouteResult", response, destination))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);
    }

    @Test
    void toRouteResult_throws_whenResultCodeNonZero() {
        // resultCode != 0 → 경로 탐색 실패 (예: 104 = 출발지/도착지 연결 불가)
        KakaoDirectionsResponse response = buildResponse(104, List.of(), null);
        Coordinate destination = new Coordinate(37.5, 127.0);

        assertThatThrownBy(
                        () ->
                                ReflectionTestUtils.invokeMethod(
                                        client, "toRouteResult", response, destination))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);
    }

    @Test
    void toRouteResult_throws_whenPathEmpty() {
        // sections가 있어도 roads/vertexes가 없으면 path가 비어 에러
        KakaoDirectionsResponse.Section emptySection = new KakaoDirectionsResponse.Section();
        ReflectionTestUtils.setField(emptySection, "duration", 0);
        ReflectionTestUtils.setField(emptySection, "roads", List.of());
        KakaoDirectionsResponse response = buildResponse(0, List.of(emptySection), buildSummary(0));
        Coordinate destination = new Coordinate(37.5, 127.0);

        assertThatThrownBy(
                        () ->
                                ReflectionTestUtils.invokeMethod(
                                        client, "toRouteResult", response, destination))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);
    }

    @Test
    void toRouteResult_fallbacksToLegSum_whenSummaryNull() {
        // summary가 null이면 구간 합산으로 totalDurationSeconds 계산
        KakaoDirectionsResponse.Section s1 =
                buildSection(300, new double[] {127.0, 37.0, 127.1, 37.1});
        KakaoDirectionsResponse.Section s2 =
                buildSection(200, new double[] {127.1, 37.1, 127.2, 37.2});
        KakaoDirectionsResponse response = buildResponse(0, List.of(s1, s2), null); // summary null
        Coordinate destination = new Coordinate(37.2, 127.2);

        RouteResult result =
                (RouteResult)
                        ReflectionTestUtils.invokeMethod(
                                client, "toRouteResult", response, destination);

        assertThat(result.getTotalDurationSeconds()).isEqualTo(500); // 300 + 200
        assertThat(result.getLegDurationsSeconds()).containsExactly(300, 200);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private KakaoDirectionsResponse buildResponse(
            int resultCode,
            List<KakaoDirectionsResponse.Section> sections,
            KakaoDirectionsResponse.Summary summary) {
        KakaoDirectionsResponse response = new KakaoDirectionsResponse();
        KakaoDirectionsResponse.Route route = new KakaoDirectionsResponse.Route();
        ReflectionTestUtils.setField(route, "resultCode", resultCode);
        ReflectionTestUtils.setField(route, "sections", sections);
        ReflectionTestUtils.setField(route, "summary", summary);
        ReflectionTestUtils.setField(response, "routes", List.of(route));
        return response;
    }

    private KakaoDirectionsResponse.Section buildSection(int duration, double[] vertexes) {
        KakaoDirectionsResponse.Section section = new KakaoDirectionsResponse.Section();
        ReflectionTestUtils.setField(section, "duration", duration);
        KakaoDirectionsResponse.Road road = new KakaoDirectionsResponse.Road();
        ReflectionTestUtils.setField(road, "vertexes", vertexes);
        ReflectionTestUtils.setField(section, "roads", List.of(road));
        return section;
    }

    private KakaoDirectionsResponse.Summary buildSummary(int duration) {
        KakaoDirectionsResponse.Summary summary = new KakaoDirectionsResponse.Summary();
        ReflectionTestUtils.setField(summary, "duration", duration);
        return summary;
    }
}

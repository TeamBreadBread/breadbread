package com.breadbread.course.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.breadbread.course.config.TmapProperties;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

@ExtendWith(MockitoExtension.class)
class TmapMatrixClientTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient webClient;

    private TmapMatrixClient client;

    @BeforeEach
    void setUp() {
        TmapProperties properties = new TmapProperties();
        properties.setAppKey("test-key");
        properties.setBaseUrl("https://apis.openapi.sk.com");
        properties.setTimeoutSeconds(10);
        client = new TmapMatrixClient(webClient, properties);
    }

    @Test
    void buildRequestBody_mapsLatToY_andLngToX() {
        List<double[]> origins = List.of(new double[] {36.0, 127.0}, new double[] {36.1, 127.1});
        List<double[]> destinations = List.of(new double[] {36.2, 127.2});

        @SuppressWarnings("unchecked")
        Map<String, Object> body =
                (Map<String, Object>)
                        ReflectionTestUtils.invokeMethod(
                                client, "buildRequestBody", origins, destinations, "car");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> originList = (List<Map<String, Object>>) body.get("origins");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> destinationList =
                (List<Map<String, Object>>) body.get("destinations");

        assertThat(originList).hasSize(2);
        assertThat(destinationList).hasSize(1);

        assertThat(originList.get(0).get("lon")).isEqualTo("127.0");
        assertThat(originList.get(0).get("lat")).isEqualTo("36.0");
        assertThat(originList.get(1).get("lon")).isEqualTo("127.1");
        assertThat(originList.get(1).get("lat")).isEqualTo("36.1");

        assertThat(destinationList.get(0).get("lon")).isEqualTo("127.2");
        assertThat(destinationList.get(0).get("lat")).isEqualTo("36.2");
    }

    @Test
    void buildRequestBody_setsTransportMode() {
        List<double[]> origins = List.of(new double[] {36.0, 127.0});
        List<double[]> destinations = List.of(new double[] {36.2, 127.2});

        @SuppressWarnings("unchecked")
        Map<String, Object> body =
                (Map<String, Object>)
                        ReflectionTestUtils.invokeMethod(
                                client, "buildRequestBody", origins, destinations, "pedestrian");

        assertThat(body.get("transportMode")).isEqualTo("pedestrian");
    }

    @Test
    void parseMatrix_placesDurationByOriginAndDestinationIndex() {
        TmapMatrixClient.TmapMatrixResponse response = new TmapMatrixClient.TmapMatrixResponse();
        ReflectionTestUtils.setField(
                response,
                "matrixRoutes",
                List.of(
                        makeRoute(0, 0, 100),
                        makeRoute(0, 1, 200),
                        makeRoute(1, 0, 300),
                        makeRoute(1, 1, 400)));

        int[][] matrix = client.parseMatrix(response, 2, 2);

        assertThat(matrix[0][0]).isEqualTo(100);
        assertThat(matrix[0][1]).isEqualTo(200);
        assertThat(matrix[1][0]).isEqualTo(300);
        assertThat(matrix[1][1]).isEqualTo(400);
    }

    @Test
    void parseMatrix_fillsMaxValueForMissingRoutes() {
        TmapMatrixClient.TmapMatrixResponse response = new TmapMatrixClient.TmapMatrixResponse();
        ReflectionTestUtils.setField(response, "matrixRoutes", List.of(makeRoute(0, 0, 500)));

        int[][] matrix = client.parseMatrix(response, 2, 2);

        assertThat(matrix[0][0]).isEqualTo(500);
        assertThat(matrix[0][1]).isEqualTo(Integer.MAX_VALUE);
        assertThat(matrix[1][0]).isEqualTo(Integer.MAX_VALUE);
        assertThat(matrix[1][1]).isEqualTo(Integer.MAX_VALUE);
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────

    private static TmapMatrixClient.TmapMatrixResponse.MatrixRoute makeRoute(
            int originIndex, int destinationIndex, int duration) {
        TmapMatrixClient.TmapMatrixResponse.MatrixRoute r =
                new TmapMatrixClient.TmapMatrixResponse.MatrixRoute();
        ReflectionTestUtils.setField(r, "originIndex", originIndex);
        ReflectionTestUtils.setField(r, "destinationIndex", destinationIndex);
        ReflectionTestUtils.setField(r, "duration", duration);
        ReflectionTestUtils.setField(r, "distance", (double) duration * 5);
        return r;
    }
}

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
        List<Map<String, Object>> startList = (List<Map<String, Object>>) body.get("startList");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> endList = (List<Map<String, Object>>) body.get("endList");

        assertThat(startList).hasSize(2);
        assertThat(endList).hasSize(1);

        // lat → startY, lng → startX
        assertThat(startList.get(0).get("startX")).isEqualTo("127.0");
        assertThat(startList.get(0).get("startY")).isEqualTo("36.0");
        assertThat(startList.get(1).get("startX")).isEqualTo("127.1");
        assertThat(startList.get(1).get("startY")).isEqualTo("36.1");

        assertThat(endList.get(0).get("endX")).isEqualTo("127.2");
        assertThat(endList.get(0).get("endY")).isEqualTo("36.2");
    }

    @Test
    void buildRequestBody_assignsSequentialNames() {
        List<double[]> origins = List.of(new double[] {36.0, 127.0}, new double[] {36.1, 127.1});
        List<double[]> destinations = List.of(new double[] {36.2, 127.2});

        @SuppressWarnings("unchecked")
        Map<String, Object> body =
                (Map<String, Object>)
                        ReflectionTestUtils.invokeMethod(
                                client, "buildRequestBody", origins, destinations, "pedestrian");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> startList = (List<Map<String, Object>>) body.get("startList");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> endList = (List<Map<String, Object>>) body.get("endList");

        assertThat(startList.get(0).get("startName")).isEqualTo("s0");
        assertThat(startList.get(1).get("startName")).isEqualTo("s1");
        assertThat(endList.get(0).get("endName")).isEqualTo("e0");
    }

    @Test
    void getMatrix_parsesResultListIntoRowMajorMatrix() {
        // 직접 TmapMatrixResponse 생성 후 parseMatrix 로직 검증
        // 2 origins × 2 destinations → 결과 4개, row-major
        TmapMatrixClient.TmapMatrixResponse response = new TmapMatrixClient.TmapMatrixResponse();
        ReflectionTestUtils.setField(
                response,
                "resultList",
                List.of(makeResult(100), makeResult(200), makeResult(300), makeResult(400)));

        int m = 2, n = 2;
        int[][] matrix = new int[m][n];
        List<?> results = (List<?>) ReflectionTestUtils.getField(response, "resultList");
        for (int i = 0; i < m; i++) {
            for (int j = 0; j < n; j++) {
                Object r = results.get(i * n + j);
                matrix[i][j] = (int) ReflectionTestUtils.getField(r, "time");
            }
        }

        assertThat(matrix[0][0]).isEqualTo(100);
        assertThat(matrix[0][1]).isEqualTo(200);
        assertThat(matrix[1][0]).isEqualTo(300);
        assertThat(matrix[1][1]).isEqualTo(400);
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────

    private static TmapMatrixClient.TmapMatrixResponse.MatrixResult makeResult(int time) {
        TmapMatrixClient.TmapMatrixResponse.MatrixResult r =
                new TmapMatrixClient.TmapMatrixResponse.MatrixResult();
        ReflectionTestUtils.setField(r, "time", time);
        ReflectionTestUtils.setField(r, "distance", time * 5);
        return r;
    }
}

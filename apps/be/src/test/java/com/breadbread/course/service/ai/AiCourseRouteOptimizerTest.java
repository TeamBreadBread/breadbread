package com.breadbread.course.service.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.course.client.TmapMatrixClient;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.RouteMode;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AiCourseRouteOptimizerTest {

    @Mock private TmapMatrixClient tmapMatrixClient;

    @InjectMocks private AiCourseRouteOptimizer optimizer;

    @Test
    void optimizeOrder_returnsSingleBakery_withoutCallingApi() {
        Bakery b = bakery(10L, 36.0, 127.0);
        CourseBakery cb = courseBakery(b, 1);
        Map<Long, double[]> coords = Map.of(10L, new double[] {36.0, 127.0});

        List<Long> result =
                optimizer.optimizeOrder(36.5, 127.5, List.of(cb), coords, RouteMode.DRIVING);

        assertThat(result).containsExactly(10L);
    }

    @Test
    void optimizeOrder_reordersGreedily_byTravelTime() {
        // 출발지에서 가장 가까운 C → B → A 순이 최적인 행렬
        // origins: [D(0), A(1), B(2), C(3)]
        // destinations: [A(0), B(1), C(2)]
        //
        // matrix[D][A]=500, [D][B]=300, [D][C]=100  → D에서 C 선택
        // matrix[C][A]=400, [C][B]=200               → C에서 B 선택
        // matrix[B][A]=200                            → B에서 A 선택
        // 결과: C → B → A (id: 30 → 20 → 10)
        int[][] matrix = {
            {500, 300, 100}, // D
            {Integer.MAX_VALUE, 200, 400}, // A
            {200, Integer.MAX_VALUE, 100}, // B
            {400, 200, Integer.MAX_VALUE}, // C
        };
        when(tmapMatrixClient.getMatrix(anyList(), anyList(), anyString())).thenReturn(matrix);

        Bakery a = bakery(10L, 36.0, 127.0);
        Bakery b = bakery(20L, 36.1, 127.1);
        Bakery c = bakery(30L, 36.2, 127.2);
        List<CourseBakery> cbs =
                List.of(courseBakery(a, 1), courseBakery(b, 2), courseBakery(c, 3));
        Map<Long, double[]> coords =
                Map.of(
                        10L, new double[] {36.0, 127.0},
                        20L, new double[] {36.1, 127.1},
                        30L, new double[] {36.2, 127.2});

        List<Long> result = optimizer.optimizeOrder(36.5, 127.5, cbs, coords, RouteMode.DRIVING);

        assertThat(result).containsExactly(30L, 20L, 10L);
    }

    @Test
    void optimizeOrder_appendsRemainingBakeries_whenSomeRoutesAreMissing() {
        // D→A=100(최소), D→B=MAX, D→C=MAX → A 선택 후 A→B, A→C 모두 MAX → break
        // break 시 미방문(B, C)를 원래 순서대로 append → A, B, C 전체 포함
        int max = Integer.MAX_VALUE;
        int[][] matrix = {
            {100, max, max}, // D
            {max, max, max}, // A
            {max, max, max}, // B
            {max, max, max}, // C
        };
        when(tmapMatrixClient.getMatrix(anyList(), anyList(), anyString())).thenReturn(matrix);

        Bakery a = bakery(10L, 36.0, 127.0);
        Bakery b = bakery(20L, 36.1, 127.1);
        Bakery c = bakery(30L, 36.2, 127.2);
        List<CourseBakery> cbs =
                List.of(courseBakery(a, 1), courseBakery(b, 2), courseBakery(c, 3));
        Map<Long, double[]> coords =
                Map.of(
                        10L, new double[] {36.0, 127.0},
                        20L, new double[] {36.1, 127.1},
                        30L, new double[] {36.2, 127.2});

        List<Long> result = optimizer.optimizeOrder(36.5, 127.5, cbs, coords, RouteMode.DRIVING);

        assertThat(result).containsExactlyInAnyOrder(10L, 20L, 30L);
        assertThat(result).hasSize(3);
        assertThat(result.get(0)).isEqualTo(10L); // A가 첫 번째
    }

    @Test
    void optimizeOrder_returnsOriginalOrder_whenTmapFails() {
        when(tmapMatrixClient.getMatrix(anyList(), anyList(), anyString()))
                .thenThrow(new RuntimeException("TMAP 오류"));

        Bakery a = bakery(10L, 36.0, 127.0);
        Bakery b = bakery(20L, 36.1, 127.1);
        List<CourseBakery> cbs = List.of(courseBakery(a, 1), courseBakery(b, 2));
        Map<Long, double[]> coords =
                Map.of(
                        10L, new double[] {36.0, 127.0},
                        20L, new double[] {36.1, 127.1});

        List<Long> result = optimizer.optimizeOrder(36.5, 127.5, cbs, coords, RouteMode.DRIVING);

        assertThat(result).containsExactly(10L, 20L);
    }

    @Test
    void optimizeOrder_returnsOriginalOrder_whenCoordMissing() {
        Bakery a = bakery(10L, 36.0, 127.0);
        Bakery b = bakery(20L, 36.1, 127.1);
        List<CourseBakery> cbs = List.of(courseBakery(a, 1), courseBakery(b, 2));
        // 빵집 20L 좌표 누락
        Map<Long, double[]> coords = Map.of(10L, new double[] {36.0, 127.0});

        List<Long> result = optimizer.optimizeOrder(36.5, 127.5, cbs, coords, RouteMode.DRIVING);

        assertThat(result).containsExactly(10L, 20L);
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────

    private static Bakery bakery(long id, double lat, double lng) {
        Bakery b =
                Bakery.builder()
                        .name("bakery" + id)
                        .address("addr")
                        .region("서울")
                        .latitude(lat)
                        .longitude(lng)
                        .phone("010")
                        .rating(4.0)
                        .mapLink("m")
                        .dineInAvailable(true)
                        .parkingAvailable(false)
                        .drinkAvailable(false)
                        .note("")
                        .build();
        ReflectionTestUtils.setField(b, "id", id);
        return b;
    }

    private static CourseBakery courseBakery(Bakery bakery, int visitOrder) {
        return CourseBakery.builder().bakery(bakery).visitOrder(visitOrder).build();
    }
}

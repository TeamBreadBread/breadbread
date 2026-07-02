package com.breadbread.course.service.ai;

import com.breadbread.course.client.TmapMatrixClient;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.RouteMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiCourseRouteOptimizer {

    private final TmapMatrixClient tmapMatrixClient;

    /**
     * TMAP Matrix API로 이동시간 행렬을 구한 뒤 greedy nearest-neighbor로 최적 방문 순서를 반환한다. 실패 시 원래 visitOrder
     * 순서대로 반환한다.
     *
     * @param bakeryCoords key=bakeryId, value=[lat, lng]
     * @return 최적화된 bakeryId 방문 순서 리스트
     */
    public List<Long> optimizeOrder(
            double departureLat,
            double departureLng,
            List<CourseBakery> courseBakeries,
            Map<Long, double[]> bakeryCoords,
            RouteMode routeMode) {

        List<Long> originalOrder =
                courseBakeries.stream().map(cb -> cb.getBakery().getId()).toList();

        if (courseBakeries.size() < 2) return originalOrder;

        try {
            // origins[0] = 출발지, origins[1..N] = 빵집들
            List<double[]> origins = new ArrayList<>();
            origins.add(new double[] {departureLat, departureLng});

            // destinations[0..N-1] = 빵집들 (origins[1..N] 과 동일 순서)
            List<double[]> destinations = new ArrayList<>();
            for (CourseBakery cb : courseBakeries) {
                double[] coord = bakeryCoords.get(cb.getBakery().getId());
                if (coord == null) {
                    log.warn("[경로 최적화] 좌표 없는 빵집 id={}, 원래 순서 유지", cb.getBakery().getId());
                    return originalOrder;
                }
                origins.add(coord);
                destinations.add(coord);
            }

            String transportMode = routeMode == RouteMode.WALKING ? "pedestrian" : "car";
            int[][] matrix = tmapMatrixClient.getMatrix(origins, destinations, transportMode);
            List<Integer> destOrder = greedyNearestNeighbor(matrix, courseBakeries.size());

            return destOrder.stream().map(i -> courseBakeries.get(i).getBakery().getId()).toList();

        } catch (Exception e) {
            log.warn("[경로 최적화] TMAP Matrix 실패, 원래 순서 유지: {}", e.getMessage());
            return originalOrder;
        }
    }

    /**
     * matrix[i][j] = origins[i] → destinations[j] 이동시간(초) origins[0]=출발지, origins[1..N]=빵집들
     * destinations[0..N-1]=빵집들
     *
     * @return destinations 인덱스 방문 순서
     */
    private List<Integer> greedyNearestNeighbor(int[][] matrix, int n) {
        boolean[] visited = new boolean[n];
        List<Integer> order = new ArrayList<>(n);

        int currentOriginIdx = 0; // 출발지 = origins[0]
        for (int step = 0; step < n; step++) {
            int bestDest = -1;
            int bestTime = Integer.MAX_VALUE;
            for (int j = 0; j < n; j++) {
                if (!visited[j] && matrix[currentOriginIdx][j] < bestTime) {
                    bestTime = matrix[currentOriginIdx][j];
                    bestDest = j;
                }
            }
            if (bestDest < 0) break;
            visited[bestDest] = true;
            order.add(bestDest);
            currentOriginIdx = bestDest + 1; // 빵집 destIdx → originsIdx = destIdx + 1
        }
        return order;
    }
}

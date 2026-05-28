package com.breadbread.tour.service;

import com.breadbread.bakery.entity.CrowdLevel;
import com.breadbread.bakery.entity.CrowdTime;
import com.breadbread.bakery.entity.DayType;
import com.breadbread.bakery.repository.CrowdTimeRepository;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseDrivingRoute;
import com.breadbread.course.entity.CourseType;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.CongestionAlertWebhookRequest;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 외부 I/O 호출 전 DB 커넥션을 반납하기 위해 트랜잭션 범위를 분리한 서비스.
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CongestionCheckQueryService {

    private final CourseRepository courseRepository;
    private final CourseBakeryRepository courseBakeryRepository;
    private final CourseDrivingRouteRepository courseDrivingRouteRepository;
    private final CrowdTimeRepository crowdTimeRepository;

    public record CheckData(
            CongestionAlertWebhookRequest webhookRequest, List<Long> candidateBakeryIds) {}

    public Optional<CheckData> loadCheckData(TourStateCache state, DayType today, LocalTime now) {
        Long courseId = state.getCourseId();
        Long userId = state.getUserId();
        int currentOrder = state.getCurrentVisitOrder();

        Optional<Course> courseOpt = courseRepository.findByIdAndActiveTrue(courseId);
        if (courseOpt.isEmpty()) {
            log.warn("[혼잡도 체크] 코스 없음 또는 비활성: userId={}, courseId={}", userId, courseId);
            return Optional.empty();
        }
        Course course = courseOpt.get();

        List<CourseBakery> sortedBakeries =
                courseBakeryRepository.findAllByCourseIdWithBakery(courseId).stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .toList();
        if (sortedBakeries.isEmpty()) return Optional.empty();

        List<CourseBakery> unvisited =
                sortedBakeries.stream().filter(cb -> cb.getVisitOrder() > currentOrder).toList();
        if (unvisited.isEmpty()) return Optional.empty();

        // 구간별 이동 시간 로드 (없으면 빈 리스트 — 체류 시간만으로 추정)
        List<Integer> legDurations =
                courseDrivingRouteRepository
                        .findById(courseId)
                        .map(CourseDrivingRoute::getLegDurations)
                        .orElse(List.of());

        boolean isAiCourse = course.getCourseType() == CourseType.AI;

        List<Long> unvisitedBakeryIds =
                unvisited.stream().map(cb -> cb.getBakery().getId()).toList();

        List<CrowdTime> crowdTimes = crowdTimeRepository.findAllByBakeryIdIn(unvisitedBakeryIds);

        Map<Long, CourseBakery> unvisitedByBakeryId =
                unvisited.stream()
                        .collect(Collectors.toMap(cb -> cb.getBakery().getId(), cb -> cb));

        // 방문 예상 시각이 peak 시간대에 겹치는 MIDDLE 이상 빵집만 필터
        Map<Long, CrowdTime> candidateMap =
                crowdTimes.stream()
                        .filter(ct -> ct.getDayType() == today)
                        .filter(ct -> ct.getCrowdLevel() != CrowdLevel.LOW)
                        .filter(ct -> ct.getPeakStart() != null && ct.getPeakEnd() != null)
                        .filter(
                                ct -> {
                                    CourseBakery cb =
                                            unvisitedByBakeryId.get(ct.getBakery().getId());
                                    return cb != null
                                            && isArrivingDuringPeak(
                                                    cb,
                                                    ct,
                                                    currentOrder,
                                                    now,
                                                    sortedBakeries,
                                                    legDurations,
                                                    isAiCourse);
                                })
                        .collect(
                                Collectors.toMap(
                                        ct -> ct.getBakery().getId(), ct -> ct, (a, b) -> a));

        if (candidateMap.isEmpty()) {
            return Optional.empty();
        }

        // CourseInfo.from() 내부에서 lazy 연관(AiCourseInfo, ManualCourseInfo, UserPreference 등)을
        // 접근하므로 트랜잭션이 살아 있는 이 메서드 안에서 빌드한다.
        CongestionAlertWebhookRequest webhookRequest =
                CongestionAlertWebhookRequest.from(state, course, sortedBakeries);

        return Optional.of(new CheckData(webhookRequest, List.copyOf(candidateMap.keySet())));
    }

    public CongestionAlertWebhookRequest loadTestData(
            Long userId, Long courseId, Optional<TourStateCache> activeTourState) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        List<CourseBakery> courseBakeries =
                courseBakeryRepository.findAllByCourseIdWithBakery(courseId);

        TourStateCache state =
                activeTourState
                        .filter(s -> s.getCourseId().equals(courseId))
                        .orElseGet(
                                () ->
                                        TourStateCache.builder()
                                                .userId(userId)
                                                .courseId(courseId)
                                                .totalBakeryCount(courseBakeries.size())
                                                .currentVisitOrder(0)
                                                .status(TourStatus.IN_PROGRESS)
                                                .startedAt(LocalDateTime.now().toString())
                                                .build());

        // CourseInfo.from() 내부 lazy 접근 → 트랜잭션 안에서 빌드
        return CongestionAlertWebhookRequest.from(state, course, courseBakeries);
    }

    private boolean isArrivingDuringPeak(
            CourseBakery cb,
            CrowdTime ct,
            int currentOrder,
            LocalTime now,
            List<CourseBakery> sortedBakeries,
            List<Integer> legDurations,
            boolean isAiCourse) {
        LocalTime estimatedArrival =
                estimateArrivalAt(
                        cb.getVisitOrder(),
                        currentOrder,
                        now,
                        sortedBakeries,
                        legDurations,
                        isAiCourse);
        return !estimatedArrival.isBefore(ct.getPeakStart())
                && !estimatedArrival.isAfter(ct.getPeakEnd());
    }

    // leg 인덱스: MANUAL → leg[i-2] (bakery1이 origin), AI → leg[i-1] (사용자 위치가 origin)
    private LocalTime estimateArrivalAt(
            int targetOrder,
            int currentOrder,
            LocalTime now,
            List<CourseBakery> sortedBakeries,
            List<Integer> legDurations,
            boolean isAiCourse) {

        boolean hasRoute = legDurations != null && !legDurations.isEmpty();
        LocalTime t = now;

        // 현재 빵집에서의 잔여 체류 시간
        if (currentOrder >= 1) {
            int stayMin =
                    sortedBakeries.get(currentOrder - 1).getBakery().getEstimatedStayMinutes();
            t = t.plusMinutes(stayMin);
        }

        // MANUAL + 미시작(currentOrder=0): bakery1이 origin이므로 already there
        //   target=1이면 도착 = now, target>1이면 bakery1 체류 후 이동
        if (!isAiCourse && currentOrder == 0) {
            if (targetOrder == 1) return t;
            t = t.plusMinutes(sortedBakeries.get(0).getBakery().getEstimatedStayMinutes());
        }

        int prevOrder = (!isAiCourse && currentOrder == 0) ? 1 : currentOrder;

        for (int v = prevOrder + 1; v <= targetOrder; v++) {
            if (hasRoute) {
                int legIndex = isAiCourse ? (v - 1) : (v - 2);
                if (legIndex >= 0 && legIndex < legDurations.size()) {
                    t = t.plusSeconds(legDurations.get(legIndex));
                }
            }
            // 경유 빵집 체류 시간 (target에서는 추가 안 함 — 도착 시각이 목표)
            if (v < targetOrder) {
                t = t.plusMinutes(sortedBakeries.get(v - 1).getBakery().getEstimatedStayMinutes());
            }
        }
        return t;
    }
}

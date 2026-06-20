package com.breadbread.tour.service;

import com.breadbread.congestion.service.CongestionSignalService;
import com.breadbread.course.entity.Course;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.client.CongestionInstantCheckClient;
import com.breadbread.tour.dto.CongestionInstantCheckRequest;
import com.breadbread.tour.dto.CongestionInstantCheckResponse;
import com.breadbread.tour.dto.TourCurrentResponse;
import com.breadbread.tour.dto.TourStartResponse;
import com.breadbread.tour.dto.TourVisitResponse;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourService {

    private final TourRedisService tourRedisService;
    private final CourseRepository courseRepository;
    private final CourseBakeryRepository courseBakeryRepository;
    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final CongestionInstantCheckClient congestionInstantCheckClient;
    private final CongestionSignalService congestionSignalService;

    @Transactional
    public TourStartResponse startTour(Long userId, UserRole role, Long courseId) {
        if (tourRedisService.hasActiveTour(userId)) {
            throw new CustomException(ErrorCode.TOUR_ALREADY_STARTED);
        }

        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        // 비공개 코스는 본인 또는 ADMIN만 투어 시작 가능 (CourseService와 동일한 규칙)
        if (!course.isShared()
                && role != UserRole.ROLE_ADMIN
                && (course.getUser() == null || !course.getUser().getId().equals(userId))) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        int totalBakeryCount = courseBakeryRepository.findAllByCourseId(courseId).size();

        if (totalBakeryCount == 0) {
            throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
        }

        // Redis 먼저 성공해야 예약 상태 전환 (실패 시 DB 롤백으로 상태 보존)
        TourStateCache state = tourRedisService.startTour(userId, course.getId(), totalBakeryCount);

        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        reservationRepository
                .findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        userId, courseId, today, ReservationStatus.CONFIRMED)
                .ifPresent(Reservation::startTour);

        return TourStartResponse.from(state);
    }

    @Transactional
    public TourVisitResponse visitBakery(Long userId, Long courseId, int visitOrder) {
        TourStateCache state =
                tourRedisService
                        .getTourState(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.TOUR_NOT_FOUND));

        if (!state.getCourseId().equals(courseId)) {
            throw new CustomException(ErrorCode.TOUR_NOT_FOUND);
        }

        if (state.getStatus() == TourStatus.COMPLETED) {
            throw new CustomException(ErrorCode.TOUR_ALREADY_COMPLETED);
        }

        // 다음 순서(currentVisitOrder + 1)만 허용 — 건너뛰기·되돌아가기 불가
        if (visitOrder != state.getCurrentVisitOrder() + 1) {
            throw new CustomException(ErrorCode.TOUR_INVALID_VISIT_ORDER);
        }

        TourStateCache updated = tourRedisService.updateVisitOrder(userId, visitOrder);

        if (updated.getStatus() == TourStatus.COMPLETED) {
            completeReservationIfExists(userId, courseId);
        }

        log.info(
                "[투어] 빵집 방문: userId={}, courseId={}, visitOrder={}, remaining={}, status={}",
                userId,
                courseId,
                visitOrder,
                updated.getTotalBakeryCount() - updated.getCurrentVisitOrder(),
                updated.getStatus());
        return TourVisitResponse.from(updated);
    }

    public TourCurrentResponse getCurrentTour(Long userId) {
        return tourRedisService.getTourState(userId).map(TourCurrentResponse::from).orElse(null);
    }

    @Transactional
    public TourCurrentResponse completeTour(Long userId, Long courseId) {
        TourStateCache state =
                tourRedisService
                        .getTourState(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.TOUR_NOT_FOUND));

        if (!state.getCourseId().equals(courseId)) {
            throw new CustomException(ErrorCode.TOUR_NOT_FOUND);
        }

        if (state.getStatus() == TourStatus.COMPLETED) {
            throw new CustomException(ErrorCode.TOUR_ALREADY_COMPLETED);
        }

        TourCurrentResponse response =
                TourCurrentResponse.from(tourRedisService.completeTour(userId));

        completeReservationIfExists(userId, courseId);

        return response;
    }

    public CongestionInstantCheckResponse checkCongestionInstant(
            Long userId, CongestionInstantCheckRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("userId", userId);
        body.put("courseId", request.getCourseId());
        body.put("bakeryIds", request.getBakeryIds());
        if (request.getTargetBakeryId() != null) {
            body.put("targetBakeryId", request.getTargetBakeryId());
        }
        CongestionInstantCheckResponse response = congestionInstantCheckClient.check(body);
        if (response.getData() != null && !response.getData().isEmpty()) {
            congestionSignalService.saveAllFromInstantCheck(response.getData());
        }
        return response;
    }

    private void completeReservationIfExists(Long userId, Long courseId) {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        reservationRepository
                .findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        userId, courseId, today, ReservationStatus.IN_PROGRESS)
                .ifPresent(
                        reservation -> {
                            reservation.complete();
                            User user =
                                    userRepository
                                            .findById(userId)
                                            .orElseThrow(
                                                    () ->
                                                            new CustomException(
                                                                    ErrorCode.USER_NOT_FOUND));
                            user.incrementUsage();
                            log.info(
                                    "[투어 완료] userId={}, courseId={}, usageCount={}, grade={}",
                                    userId,
                                    courseId,
                                    user.getUsageCount(),
                                    user.getGrade());
                        });
    }
}

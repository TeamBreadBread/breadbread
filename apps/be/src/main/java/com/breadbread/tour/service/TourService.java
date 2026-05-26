package com.breadbread.tour.service;

import com.breadbread.course.entity.Course;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.TourCurrentResponse;
import com.breadbread.tour.dto.TourStartResponse;
import com.breadbread.tour.dto.TourVisitResponse;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.breadbread.user.entity.UserRole;
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

    @Transactional(readOnly = true)
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

        TourStateCache state = tourRedisService.startTour(userId, course.getId(), totalBakeryCount);

        return TourStartResponse.from(state);
    }

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
        TourStateCache state =
                tourRedisService
                        .getTourState(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.TOUR_NOT_FOUND));
        return TourCurrentResponse.from(state);
    }

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

        return TourCurrentResponse.from(tourRedisService.completeTour(userId));
    }
}

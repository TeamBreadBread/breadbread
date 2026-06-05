package com.breadbread.tour.service;

import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.dto.ActiveTourResponse;
import com.breadbread.tour.redis.TourStateCache;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActiveTourService {

    private static final int PRE_DEPARTURE_WINDOW_MINUTES = 30;

    private final TourRedisService tourRedisService;
    private final CourseBakeryRepository courseBakeryRepository;
    private final ReservationRepository reservationRepository;

    @Transactional(readOnly = true)
    public List<ActiveTourResponse> getActiveTours() {
        List<ActiveTourResponse> result = new ArrayList<>();

        // 1. 현재 투어 중인 사용자 (Redis)
        for (Long userId : tourRedisService.getAllActiveUserIds()) {
            tourRedisService
                    .getTourState(userId)
                    .ifPresent(
                            state -> {
                                result.add(toResponse(state, "IN_PROGRESS"));
                            });
        }

        // 2. 예약 임박 (출발 30분 이내, 아직 투어 시작 안 한 사용자)
        ZoneId seoul = ZoneId.of("Asia/Seoul");
        LocalDate today = LocalDate.now(seoul);
        LocalTime now = LocalTime.now(seoul);
        LocalTime windowEnd = now.plusMinutes(PRE_DEPARTURE_WINDOW_MINUTES);

        List<Reservation> upcoming =
                reservationRepository.findTodayConfirmedWithCourse(
                        today, ReservationStatus.CONFIRMED);

        for (Reservation reservation : upcoming) {
            LocalTime departureTime = reservation.getDepartureTime();
            if (departureTime.isBefore(now) || departureTime.isAfter(windowEnd)) continue;

            Long userId = reservation.getUser().getId();

            // 이미 투어 중인 사용자는 중복 제외
            if (tourRedisService.hasActiveTour(userId)) continue;

            List<Long> bakeryIds =
                    reservation.getCourse().getCourseBakeries().stream()
                            .map(cb -> cb.getBakery().getId())
                            .toList();

            result.add(
                    ActiveTourResponse.builder()
                            .userId(userId)
                            .courseId(reservation.getCourse().getId())
                            .bakeryIds(bakeryIds)
                            .status("PRE_DEPARTURE")
                            .startedAt(departureTime.toString())
                            .build());
        }

        return result;
    }

    private ActiveTourResponse toResponse(TourStateCache state, String status) {
        List<Long> bakeryIds =
                courseBakeryRepository.findAllByCourseIdWithBakery(state.getCourseId()).stream()
                        .map(cb -> cb.getBakery().getId())
                        .toList();

        return ActiveTourResponse.builder()
                .userId(state.getUserId())
                .courseId(state.getCourseId())
                .bakeryIds(bakeryIds)
                .currentVisitOrder(state.getCurrentVisitOrder())
                .status(status)
                .startedAt(state.getStartedAt())
                .build();
    }
}

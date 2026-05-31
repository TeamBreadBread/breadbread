package com.breadbread.reservation.service;

import com.breadbread.notification.service.FcmService;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationDailyService {

    private final ReservationRepository reservationRepository;
    private final FcmService fcmService;

    @Transactional
    public void notifyTodayConfirmed() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        List<Reservation> reservations =
                reservationRepository.findTodayConfirmedWithCourse(
                        today, ReservationStatus.CONFIRMED);
        if (reservations.isEmpty()) return;

        log.info("[오늘 투어 알림] CONFIRMED 예약 수: {}", reservations.size());

        for (Reservation reservation : reservations) {
            Long userId = reservation.getUser().getId();
            Long reservationId = reservation.getId();
            String courseName = reservation.getCourseNameSnapshot();

            fcmService.sendToUser(
                    userId,
                    "오늘의 빵집 투어",
                    courseName + " 코스 출발일입니다! 즐거운 빵집 투어 되세요!",
                    Map.of(
                            "type", "TODAY_TOUR",
                            "courseId", String.valueOf(reservation.getCourse().getId()),
                            "reservationId", String.valueOf(reservationId)));

            log.info("[오늘 투어 알림] 발송: userId={}, reservationId={}", userId, reservationId);
        }
    }

    @Transactional
    public void cancelExpiredPending() {
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Seoul"));
        List<Reservation> expired =
                reservationRepository.findExpiredPending(today, ReservationStatus.PENDING);
        if (expired.isEmpty()) return;

        log.info("[만료 예약 취소] 대상 수: {}", expired.size());

        for (Reservation reservation : expired) {
            reservation.cancel();
            log.info("[만료 예약 취소] reservationId={}", reservation.getId());
        }
    }
}

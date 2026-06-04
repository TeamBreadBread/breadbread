package com.breadbread.reservation.service;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.notification.service.FcmService;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.service.CooldownRedisService;
import com.breadbread.tour.service.TourRedisService;
import com.breadbread.tour.service.TourService;
import com.breadbread.user.entity.UserRole;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReservationRealTimeServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private CooldownRedisService cooldownRedisService;
    @Mock private FcmService fcmService;
    @Mock private TourService tourService;
    @Mock private TourRedisService tourRedisService;

    @InjectMocks private ReservationRealTimeService service;

    // ─────────────────── processHourlyEvents ───────────────────

    @Test
    void processHourlyEvents_예약없으면_아무것도하지않음() {
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of());

        service.processHourlyEvents();

        verify(fcmService, never()).sendToUser(anyLong(), any(), any(), any());
        verify(tourService, never()).startTour(anyLong(), any(), anyLong());
    }

    // ─────────────────── 1시간 전 알림 ───────────────────

    @Test
    void notifyOneHourBefore_윈도우_밖이면_FCM미전송() {
        Reservation reservation = stubReservation(1L, 10L, nowPlusMinutes(120));
        stubTodayConfirmed(reservation);

        service.processHourlyEvents();

        verify(fcmService, never()).sendToUser(anyLong(), eq("투어 1시간 전 알림"), any(), any());
    }

    @Test
    void notifyOneHourBefore_이미처리된경우_FCM미전송() {
        Reservation reservation = stubReservation(1L, 10L, nowPlusMinutes(60));
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkOneHourBeforeNotified(1L, 1L)).thenReturn(false);

        service.processHourlyEvents();

        verify(fcmService, never()).sendToUser(anyLong(), eq("투어 1시간 전 알림"), any(), any());
    }

    @Test
    void notifyOneHourBefore_윈도우내_미처리_FCM전송() {
        Reservation reservation = stubReservation(1L, 10L, nowPlusMinutes(60));
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkOneHourBeforeNotified(1L, 1L)).thenReturn(true);

        service.processHourlyEvents();

        verify(fcmService).sendToUser(eq(1L), eq("투어 1시간 전 알림"), anyString(), anyMap());
    }

    // ─────────────────── 10분 전 알림 ───────────────────

    @Test
    void notifyTenMinBefore_윈도우_밖이면_FCM미전송() {
        Reservation reservation = stubReservation(1L, 10L, nowPlusMinutes(60));
        stubTodayConfirmed(reservation);

        service.processTenMinEvents();

        verify(fcmService, never()).sendToUser(anyLong(), eq("투어 10분 전 알림"), any(), any());
    }

    @Test
    void notifyTenMinBefore_이미처리된경우_FCM미전송() {
        Reservation reservation = stubReservation(1L, 10L, nowPlusMinutes(10));
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkTenMinBeforeNotified(1L, 1L)).thenReturn(false);

        service.processTenMinEvents();

        verify(fcmService, never()).sendToUser(anyLong(), eq("투어 10분 전 알림"), any(), any());
    }

    @Test
    void notifyTenMinBefore_윈도우내_미처리_FCM전송() {
        Reservation reservation = stubReservation(1L, 10L, nowPlusMinutes(10));
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkTenMinBeforeNotified(1L, 1L)).thenReturn(true);

        service.processTenMinEvents();

        verify(fcmService).sendToUser(eq(1L), eq("투어 10분 전 알림"), anyString(), anyMap());
    }

    // ─────────────────── 투어 시작 ───────────────────

    @Test
    void startTourAtDeparture_윈도우_밖이면_tourService미호출() {
        Reservation reservation = stubReservation(1L, 10L, nowPlusMinutes(30));
        stubTodayConfirmed(reservation);

        service.processHourlyEvents();

        verify(tourService, never()).startTour(anyLong(), any(), anyLong());
    }

    @Test
    void startTourAtDeparture_이미처리된경우_tourService미호출() {
        Reservation reservation = stubReservation(1L, 10L, now());
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkTourStartNotified(1L, 1L)).thenReturn(false);

        service.processHourlyEvents();

        verify(tourService, never()).startTour(anyLong(), any(), anyLong());
    }

    @Test
    void startTourAtDeparture_정상시작_FCM전송() {
        Reservation reservation = stubReservation(1L, 10L, now());
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkTourStartNotified(1L, 1L)).thenReturn(true);

        service.processHourlyEvents();

        verify(tourService).startTour(eq(1L), eq(UserRole.ROLE_USER), eq(10L));
        verify(fcmService).sendToUser(eq(1L), eq("투어 시작"), anyString(), anyMap());
    }

    @Test
    void startTourAtDeparture_TOUR_ALREADY_STARTED_같은코스_deleteMark미호출() {
        Reservation reservation = stubReservation(1L, 10L, now());
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkTourStartNotified(1L, 1L)).thenReturn(true);
        when(tourService.startTour(anyLong(), any(), anyLong()))
                .thenThrow(new CustomException(ErrorCode.TOUR_ALREADY_STARTED));
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(TourStateCache.builder().courseId(10L).build()));

        service.processHourlyEvents();

        verify(cooldownRedisService, never()).deleteTourStartMark(anyLong(), anyLong());
        verify(fcmService, never()).sendToUser(anyLong(), eq("투어 시작"), any(), any());
    }

    @Test
    void startTourAtDeparture_TOUR_ALREADY_STARTED_다른코스_deleteMark호출() {
        Reservation reservation = stubReservation(1L, 10L, now());
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkTourStartNotified(1L, 1L)).thenReturn(true);
        when(tourService.startTour(anyLong(), any(), anyLong()))
                .thenThrow(new CustomException(ErrorCode.TOUR_ALREADY_STARTED));
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(TourStateCache.builder().courseId(99L).build()));

        service.processHourlyEvents();

        verify(cooldownRedisService).deleteTourStartMark(1L, 1L);
        verify(fcmService, never()).sendToUser(anyLong(), eq("투어 시작"), any(), any());
    }

    @Test
    void startTourAtDeparture_기타예외_deleteMark호출() {
        Reservation reservation = stubReservation(1L, 10L, now());
        stubTodayConfirmed(reservation);
        when(cooldownRedisService.tryMarkTourStartNotified(1L, 1L)).thenReturn(true);
        when(tourService.startTour(anyLong(), any(), anyLong()))
                .thenThrow(new CustomException(ErrorCode.COURSE_NOT_FOUND));

        service.processHourlyEvents();

        verify(cooldownRedisService).deleteTourStartMark(1L, 1L);
        verify(fcmService, never()).sendToUser(anyLong(), eq("투어 시작"), any(), any());
    }

    // ─────────────────── helpers ───────────────────

    private void stubTodayConfirmed(Reservation... reservations) {
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservations));
    }

    private static Reservation stubReservation(
            Long reservationId, Long courseId, LocalTime departureTime) {
        Reservation reservation = mock(Reservation.class, Answers.RETURNS_DEEP_STUBS);
        when(reservation.getDepartureTime()).thenReturn(departureTime);
        lenient().when(reservation.getId()).thenReturn(reservationId);
        lenient().when(reservation.getUser().getId()).thenReturn(1L);
        lenient().when(reservation.getUser().getRole()).thenReturn(UserRole.ROLE_USER);
        lenient().when(reservation.getCourse().getId()).thenReturn(courseId);
        lenient().when(reservation.getCourseNameSnapshot()).thenReturn("테스트 코스");
        return reservation;
    }

    private static LocalTime now() {
        return LocalTime.now(ZoneId.of("Asia/Seoul")).withSecond(0).withNano(0);
    }

    /**
     * now() + minutes 가 자정을 넘으면 LocalDateTime 기반 minutesUntil 계산이 음수가 됩니다. 해당 케이스는 자정 근처 실행 시
     * 스킵합니다.
     */
    private static LocalTime nowPlusMinutes(int minutes) {
        LocalTime now = now();
        LocalTime result = now.plusMinutes(minutes);
        Assumptions.assumeTrue(result.isAfter(now), "자정 근처 실행으로 인해 스킵 (departure time이 날짜를 넘어감)");
        return result;
    }
}

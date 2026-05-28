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

import com.breadbread.notification.service.FcmService;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.service.CooldownRedisService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DepartureReminderServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private CooldownRedisService cooldownRedisService;
    @Mock private FcmService fcmService;

    @InjectMocks private DepartureReminderService departureReminderService;

    @Test
    void notifyPreDeparture_예약없으면_FCM미전송() {
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of());

        departureReminderService.notifyPreDeparture();

        verify(fcmService, never()).sendToUser(anyLong(), any(), any(), any());
    }

    @Test
    void notifyPreDeparture_과거출발시각_스킵() {
        // 자정(00:00)은 낮 시간대 테스트 실행 시 항상 now 이전
        Reservation reservation = stubReservation(LocalTime.of(0, 0), 1L, 10L);
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservation));

        departureReminderService.notifyPreDeparture();

        verify(fcmService, never()).sendToUser(anyLong(), any(), any(), any());
    }

    @Test
    void notifyPreDeparture_이미알림전송된_예약_스킵() {
        LocalTime inWindow = LocalTime.now(ZoneId.of("Asia/Seoul")).plusMinutes(30);
        Reservation reservation = stubReservation(inWindow, 1L, 10L);
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservation));
        when(cooldownRedisService.isPreDepartureNotified(1L, 1L)).thenReturn(true);

        departureReminderService.notifyPreDeparture();

        verify(fcmService, never()).sendToUser(anyLong(), any(), any(), any());
    }

    @Test
    void notifyPreDeparture_윈도우내_미전송예약_FCM전송_및_쿨다운_등록() {
        LocalTime inWindow = LocalTime.now(ZoneId.of("Asia/Seoul")).plusMinutes(30);
        Reservation reservation = stubReservation(inWindow, 1L, 10L);
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservation));
        when(cooldownRedisService.isPreDepartureNotified(1L, 1L)).thenReturn(false);

        departureReminderService.notifyPreDeparture();

        verify(fcmService).sendToUser(eq(1L), eq("투어 출발 알림"), anyString(), anyMap());
        verify(cooldownRedisService).markPreDepartureNotified(1L, 1L);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private static Reservation stubReservation(
            LocalTime departureTime, Long reservationId, Long courseId) {
        Reservation reservation = mock(Reservation.class, Answers.RETURNS_DEEP_STUBS);
        // getDepartureTime은 항상 호출되지만 나머지는 조기 종료 경로에서 호출되지 않을 수 있음
        when(reservation.getDepartureTime()).thenReturn(departureTime);
        lenient().when(reservation.getId()).thenReturn(reservationId);
        lenient().when(reservation.getUser().getId()).thenReturn(1L);
        lenient().when(reservation.getCourse().getId()).thenReturn(courseId);
        return reservation;
    }
}

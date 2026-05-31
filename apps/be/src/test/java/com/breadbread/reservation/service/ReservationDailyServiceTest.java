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
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReservationDailyServiceTest {

    @Mock private ReservationRepository reservationRepository;
    @Mock private FcmService fcmService;

    @InjectMocks private ReservationDailyService reservationDailyService;

    // ───────────────── notifyTodayConfirmed ─────────────────

    @Test
    void notifyTodayConfirmed_예약없으면_FCM미전송() {
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of());

        reservationDailyService.notifyTodayConfirmed();

        verify(fcmService, never()).sendToUser(anyLong(), any(), any(), any());
    }

    @Test
    void notifyTodayConfirmed_CONFIRMED예약있으면_FCM전송() {
        Reservation reservation = stubConfirmedReservation(1L, 10L, "서울 빵집 투어");
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservation));

        reservationDailyService.notifyTodayConfirmed();

        verify(fcmService).sendToUser(eq(1L), eq("오늘의 빵집 투어"), anyString(), anyMap());
    }

    // ───────────────── cancelExpiredPending ─────────────────

    @Test
    void cancelExpiredPending_만료예약없으면_취소처리없음() {
        when(reservationRepository.findExpiredPending(
                        any(LocalDate.class), eq(ReservationStatus.PENDING)))
                .thenReturn(List.of());

        reservationDailyService.cancelExpiredPending();

        verify(reservationRepository, never()).save(any());
    }

    @Test
    void cancelExpiredPending_만료PENDING_cancel호출() {
        Reservation reservation = mock(Reservation.class);
        lenient().when(reservation.getId()).thenReturn(1L);
        when(reservationRepository.findExpiredPending(
                        any(LocalDate.class), eq(ReservationStatus.PENDING)))
                .thenReturn(List.of(reservation));

        reservationDailyService.cancelExpiredPending();

        verify(reservation).cancel();
    }

    // ───────────────────────── helpers ──────────────────────

    private static Reservation stubConfirmedReservation(
            Long reservationId, Long courseId, String courseName) {
        Reservation reservation = mock(Reservation.class, Answers.RETURNS_DEEP_STUBS);
        lenient().when(reservation.getId()).thenReturn(reservationId);
        lenient().when(reservation.getUser().getId()).thenReturn(1L);
        lenient().when(reservation.getCourse().getId()).thenReturn(courseId);
        lenient().when(reservation.getCourseNameSnapshot()).thenReturn(courseName);
        return reservation;
    }
}

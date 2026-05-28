package com.breadbread.tour.service;

import static org.assertj.core.api.Assertions.assertThat;
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

import com.breadbread.bakery.entity.DayType;
import com.breadbread.notification.service.FcmService;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.client.CongestionAlertWebhookClient;
import com.breadbread.tour.dto.CongestionAlertWebhookRequest;
import com.breadbread.tour.dto.CongestionAlertWebhookResponse;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CongestionCheckServiceTest {

    @Mock private TourRedisService tourRedisService;
    @Mock private CooldownRedisService cooldownRedisService;
    @Mock private CongestionCheckQueryService queryService;
    @Mock private CongestionAlertWebhookClient webhookClient;
    @Mock private FcmService fcmService;
    @Mock private ObjectMapper objectMapper;
    @Mock private ReservationRepository reservationRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private CongestionCheckService congestionCheckService;

    private static final LocalDate TODAY = LocalDate.of(2026, 5, 28);
    private static final DayType WEEKDAY = DayType.WEEKDAY;

    // ───────────────────────────── processState ─────────────────────────────

    @Test
    void processState_후보없으면_false() {
        TourStateCache state = tourState(1L, 10L);
        when(queryService.loadCheckData(eq(state), eq(WEEKDAY), any(LocalTime.class)))
                .thenReturn(Optional.empty());

        boolean result =
                ReflectionTestUtils.invokeMethod(
                        congestionCheckService,
                        "processState",
                        state,
                        WEEKDAY,
                        LocalTime.of(14, 0));

        assertThat(result).isFalse();
        verify(fcmService, never()).sendToUserSync(anyLong(), any(), any(), any());
    }

    @Test
    void processState_전체쿨다운중이면_false() {
        TourStateCache state = tourState(1L, 10L);
        CongestionCheckQueryService.CheckData checkData =
                new CongestionCheckQueryService.CheckData(
                        mock(CongestionAlertWebhookRequest.class), List.of(100L));

        when(queryService.loadCheckData(eq(state), eq(WEEKDAY), any(LocalTime.class)))
                .thenReturn(Optional.of(checkData));
        when(cooldownRedisService.isOnCooldown(1L, 100L)).thenReturn(true);

        boolean result =
                ReflectionTestUtils.invokeMethod(
                        congestionCheckService,
                        "processState",
                        state,
                        WEEKDAY,
                        LocalTime.of(14, 0));

        assertThat(result).isFalse();
        verify(cooldownRedisService, never()).tryAcquireProcessingLock(anyLong());
    }

    @Test
    void processState_락_획득_실패시_false() {
        TourStateCache state = tourState(1L, 10L);
        CongestionCheckQueryService.CheckData checkData =
                new CongestionCheckQueryService.CheckData(
                        mock(CongestionAlertWebhookRequest.class), List.of(100L));

        when(queryService.loadCheckData(eq(state), eq(WEEKDAY), any(LocalTime.class)))
                .thenReturn(Optional.of(checkData));
        when(cooldownRedisService.isOnCooldown(1L, 100L)).thenReturn(false);
        when(cooldownRedisService.tryAcquireProcessingLock(1L)).thenReturn(false);

        boolean result =
                ReflectionTestUtils.invokeMethod(
                        congestionCheckService,
                        "processState",
                        state,
                        WEEKDAY,
                        LocalTime.of(14, 0));

        assertThat(result).isFalse();
        verify(webhookClient, never()).requestAlert(any());
    }

    @Test
    void processState_락_획득_후_재확인에서_쿨다운이면_false() {
        TourStateCache state = tourState(1L, 10L);
        CongestionCheckQueryService.CheckData checkData =
                new CongestionCheckQueryService.CheckData(
                        mock(CongestionAlertWebhookRequest.class), List.of(100L));

        when(queryService.loadCheckData(eq(state), eq(WEEKDAY), any(LocalTime.class)))
                .thenReturn(Optional.of(checkData));
        // 첫 번째 체크: 미처리, 재확인(락 이후): 이미 처리됨
        when(cooldownRedisService.isOnCooldown(1L, 100L)).thenReturn(false).thenReturn(true);
        when(cooldownRedisService.tryAcquireProcessingLock(1L)).thenReturn(true);

        boolean result =
                ReflectionTestUtils.invokeMethod(
                        congestionCheckService,
                        "processState",
                        state,
                        WEEKDAY,
                        LocalTime.of(14, 0));

        assertThat(result).isFalse();
        verify(webhookClient, never()).requestAlert(any());
    }

    @Test
    void processState_FCM성공시_true_및_쿨다운_등록() {
        TourStateCache state = tourState(1L, 10L);
        CongestionAlertWebhookRequest mockRequest = mock(CongestionAlertWebhookRequest.class);
        CongestionCheckQueryService.CheckData checkData =
                new CongestionCheckQueryService.CheckData(mockRequest, List.of(100L, 200L));
        CongestionAlertWebhookResponse response = webhookResponse("혼잡 알림", "빵집이 혼잡합니다.");

        when(queryService.loadCheckData(eq(state), eq(WEEKDAY), any(LocalTime.class)))
                .thenReturn(Optional.of(checkData));
        when(cooldownRedisService.isOnCooldown(anyLong(), anyLong())).thenReturn(false);
        when(cooldownRedisService.tryAcquireProcessingLock(1L)).thenReturn(true);
        when(webhookClient.requestAlert(mockRequest)).thenReturn(response);
        when(fcmService.sendToUserSync(eq(1L), anyString(), anyString(), anyMap()))
                .thenReturn(true);

        boolean result =
                ReflectionTestUtils.invokeMethod(
                        congestionCheckService,
                        "processState",
                        state,
                        WEEKDAY,
                        LocalTime.of(14, 0));

        assertThat(result).isTrue();
        verify(cooldownRedisService).markAttempted(1L, 100L);
        verify(cooldownRedisService).markAttempted(1L, 200L);
    }

    @Test
    void processState_FCM실패시_false_및_쿨다운_미등록() {
        TourStateCache state = tourState(1L, 10L);
        CongestionAlertWebhookRequest mockRequest = mock(CongestionAlertWebhookRequest.class);
        CongestionCheckQueryService.CheckData checkData =
                new CongestionCheckQueryService.CheckData(mockRequest, List.of(100L));
        CongestionAlertWebhookResponse response = webhookResponse("제목", "내용");

        when(queryService.loadCheckData(eq(state), eq(WEEKDAY), any(LocalTime.class)))
                .thenReturn(Optional.of(checkData));
        when(cooldownRedisService.isOnCooldown(anyLong(), anyLong())).thenReturn(false);
        when(cooldownRedisService.tryAcquireProcessingLock(1L)).thenReturn(true);
        when(webhookClient.requestAlert(mockRequest)).thenReturn(response);
        when(fcmService.sendToUserSync(eq(1L), anyString(), anyString(), anyMap()))
                .thenReturn(false);

        boolean result =
                ReflectionTestUtils.invokeMethod(
                        congestionCheckService,
                        "processState",
                        state,
                        WEEKDAY,
                        LocalTime.of(14, 0));

        assertThat(result).isFalse();
        verify(cooldownRedisService, never()).markAttempted(anyLong(), anyLong());
    }

    // ───────────────────────────── checkPreTourCongestion ─────────────────────────────

    @Test
    void checkPreTourCongestion_예약없으면_processState_미호출() {
        when(reservationRepository.findTodayConfirmedWithCourse(TODAY, ReservationStatus.CONFIRMED))
                .thenReturn(List.of());

        ReflectionTestUtils.invokeMethod(
                congestionCheckService,
                "checkPreTourCongestion",
                TODAY,
                WEEKDAY,
                LocalTime.of(12, 0));

        verify(fcmService, never()).sendToUserSync(anyLong(), any(), any(), any());
    }

    @Test
    void checkPreTourCongestion_과거출발시각_스킵() {
        // 12:00 기준, 09:00 출발은 already passed → skip
        Reservation reservation = stubReservation(LocalTime.of(9, 0), 1L, 10L);
        when(reservationRepository.findTodayConfirmedWithCourse(TODAY, ReservationStatus.CONFIRMED))
                .thenReturn(List.of(reservation));

        ReflectionTestUtils.invokeMethod(
                congestionCheckService,
                "checkPreTourCongestion",
                TODAY,
                WEEKDAY,
                LocalTime.of(12, 0));

        verify(fcmService, never()).sendToUserSync(anyLong(), any(), any(), any());
    }

    @Test
    void checkPreTourCongestion_윈도우_밖_출발시각_스킵() {
        // 12:00 기준 window=14:00, 15:00 출발은 윈도우 밖 → skip
        Reservation reservation = stubReservation(LocalTime.of(15, 0), 1L, 10L);
        when(reservationRepository.findTodayConfirmedWithCourse(TODAY, ReservationStatus.CONFIRMED))
                .thenReturn(List.of(reservation));

        ReflectionTestUtils.invokeMethod(
                congestionCheckService,
                "checkPreTourCongestion",
                TODAY,
                WEEKDAY,
                LocalTime.of(12, 0));

        verify(fcmService, never()).sendToUserSync(anyLong(), any(), any(), any());
    }

    @Test
    void checkPreTourCongestion_활성투어_있으면_스킵() {
        Reservation reservation = stubReservation(LocalTime.of(13, 0), 1L, 10L);
        when(reservationRepository.findTodayConfirmedWithCourse(TODAY, ReservationStatus.CONFIRMED))
                .thenReturn(List.of(reservation));
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.of(tourState(1L, 10L)));

        ReflectionTestUtils.invokeMethod(
                congestionCheckService,
                "checkPreTourCongestion",
                TODAY,
                WEEKDAY,
                LocalTime.of(12, 0));

        verify(fcmService, never()).sendToUserSync(anyLong(), any(), any(), any());
    }

    @Test
    void checkPreTourCongestion_이미혼잡도체크된_예약_스킵() {
        Reservation reservation = stubReservation(LocalTime.of(13, 0), 1L, 10L);
        when(reservationRepository.findTodayConfirmedWithCourse(TODAY, ReservationStatus.CONFIRMED))
                .thenReturn(List.of(reservation));
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(cooldownRedisService.isPreDepartureCongestionChecked(1L, 1L)).thenReturn(true);

        ReflectionTestUtils.invokeMethod(
                congestionCheckService,
                "checkPreTourCongestion",
                TODAY,
                WEEKDAY,
                LocalTime.of(12, 0));

        verify(fcmService, never()).sendToUserSync(anyLong(), any(), any(), any());
    }

    @Test
    void checkPreTourCongestion_FCM성공시_혼잡도체크_완료_등록() {
        Reservation reservation = stubReservation(LocalTime.of(13, 0), 1L, 10L);
        CongestionAlertWebhookRequest mockRequest = mock(CongestionAlertWebhookRequest.class);
        CongestionCheckQueryService.CheckData checkData =
                new CongestionCheckQueryService.CheckData(mockRequest, List.of(100L));
        CongestionAlertWebhookResponse response = webhookResponse("제목", "내용");

        when(reservationRepository.findTodayConfirmedWithCourse(TODAY, ReservationStatus.CONFIRMED))
                .thenReturn(List.of(reservation));
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(cooldownRedisService.isPreDepartureCongestionChecked(1L, 1L)).thenReturn(false);
        // processState 내부: queryService.loadCheckData는 synthetic state + departureTime=13:00
        when(queryService.loadCheckData(
                        any(TourStateCache.class), eq(WEEKDAY), eq(LocalTime.of(13, 0))))
                .thenReturn(Optional.of(checkData));
        when(cooldownRedisService.isOnCooldown(anyLong(), anyLong())).thenReturn(false);
        when(cooldownRedisService.tryAcquireProcessingLock(1L)).thenReturn(true);
        when(webhookClient.requestAlert(mockRequest)).thenReturn(response);
        when(fcmService.sendToUserSync(eq(1L), anyString(), anyString(), anyMap()))
                .thenReturn(true);

        ReflectionTestUtils.invokeMethod(
                congestionCheckService,
                "checkPreTourCongestion",
                TODAY,
                WEEKDAY,
                LocalTime.of(12, 0));

        verify(cooldownRedisService).markPreDepartureCongestionChecked(1L, 1L);
    }

    // ───────────────────────────── testWebhook ─────────────────────────────

    @Test
    void testWebhook_관리자면_FCM전송() {
        CongestionAlertWebhookRequest mockRequest = mock(CongestionAlertWebhookRequest.class);
        CongestionAlertWebhookResponse response = webhookResponse("알림", "내용");

        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(queryService.loadTestData(eq(1L), eq(10L), any())).thenReturn(mockRequest);
        when(webhookClient.requestAlert(mockRequest)).thenReturn(response);
        when(userRepository.existsByIdAndRole(1L, UserRole.ROLE_ADMIN)).thenReturn(true);

        congestionCheckService.testWebhook(1L, 10L);

        verify(fcmService).sendToUser(eq(1L), anyString(), anyString(), anyMap());
    }

    @Test
    void testWebhook_비관리자면_FCM_미전송() {
        CongestionAlertWebhookRequest mockRequest = mock(CongestionAlertWebhookRequest.class);
        CongestionAlertWebhookResponse response = webhookResponse("알림", "내용");

        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(queryService.loadTestData(eq(1L), eq(10L), any())).thenReturn(mockRequest);
        when(webhookClient.requestAlert(mockRequest)).thenReturn(response);
        when(userRepository.existsByIdAndRole(1L, UserRole.ROLE_ADMIN)).thenReturn(false);

        congestionCheckService.testWebhook(1L, 10L);

        verify(fcmService, never()).sendToUser(anyLong(), any(), any(), any());
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private static TourStateCache tourState(Long userId, Long courseId) {
        return TourStateCache.builder()
                .userId(userId)
                .courseId(courseId)
                .totalBakeryCount(3)
                .currentVisitOrder(1)
                .status(TourStatus.IN_PROGRESS)
                .startedAt("2026-05-28T12:00:00")
                .build();
    }

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

    private static CongestionAlertWebhookResponse webhookResponse(String title, String message) {
        CongestionAlertWebhookResponse response = mock(CongestionAlertWebhookResponse.class);
        CongestionAlertWebhookResponse.SuggestionData data =
                mock(CongestionAlertWebhookResponse.SuggestionData.class);
        // 비관리자 경로에서는 getData()가 호출되지 않으므로 lenient 처리
        lenient().when(response.getData()).thenReturn(data);
        lenient().when(data.getTitle()).thenReturn(title);
        lenient().when(data.getMessage()).thenReturn(message);
        return response;
    }
}

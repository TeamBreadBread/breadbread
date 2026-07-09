package com.breadbread.scheduler;

import com.breadbread.bakery.service.GooglePlacesUpdateService;
import com.breadbread.bakery.service.KakaoLocalUpdateService;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.image.service.TempImageService;
import com.breadbread.reservation.service.ReservationDailyService;
import com.breadbread.reservation.service.ReservationRealTimeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@Tag(name = "스케줄러 — GCP Cloud Scheduler 전용")
@RestController
@RequestMapping("/scheduler")
@RequiredArgsConstructor
public class SchedulerController {

    private final ReservationDailyService reservationDailyService;
    private final ReservationRealTimeService reservationRealTimeService;
    private final TempImageService tempImageService;
    private final GooglePlacesUpdateService googlePlacesUpdateService;
    private final KakaoLocalUpdateService kakaoLocalUpdateService;

    @Operation(summary = "만료 예약 취소 + 당일 예약 알림 (매일 09:00)")
    @PostMapping("/reservation-daily")
    @ResponseStatus(HttpStatus.OK)
    @SchedulerLock(
            name = "schedulerController_reservationDaily",
            lockAtMostFor = "PT10M",
            lockAtLeastFor = "PT1M")
    public ApiResponse<Void> reservationDaily() {
        log.info("[스케줄러] reservation-daily 실행");
        reservationDailyService.cancelExpiredPending();
        reservationDailyService.notifyTodayConfirmed();
        return ApiResponse.ok();
    }

    @Operation(summary = "1시간 전 알림 + 투어 자동 시작 (매시간 정각/30분)")
    @PostMapping("/reservation-realtime-hourly")
    @ResponseStatus(HttpStatus.OK)
    @SchedulerLock(
            name = "schedulerController_realtimeHourly",
            lockAtMostFor = "PT25M",
            lockAtLeastFor = "PT1M")
    public ApiResponse<Void> reservationRealtimeHourly() {
        log.info("[스케줄러] reservation-realtime-hourly 실행");
        reservationRealTimeService.processHourlyEvents();
        return ApiResponse.ok();
    }

    @Operation(summary = "10분 전 알림 (매시간 20분/50분)")
    @PostMapping("/reservation-realtime-ten-min")
    @ResponseStatus(HttpStatus.OK)
    @SchedulerLock(
            name = "schedulerController_realtimeTenMin",
            lockAtMostFor = "PT15M",
            lockAtLeastFor = "PT1M")
    public ApiResponse<Void> reservationRealtimeTenMin() {
        log.info("[스케줄러] reservation-realtime-ten-min 실행");
        reservationRealTimeService.processTenMinEvents();
        return ApiResponse.ok();
    }

    @Operation(summary = "임시 이미지 정리 (매일 04:00)")
    @PostMapping("/temp-image-cleanup")
    @ResponseStatus(HttpStatus.OK)
    @SchedulerLock(
            name = "schedulerController_tempImageCleanup",
            lockAtMostFor = "PT10M",
            lockAtLeastFor = "PT1M")
    public ApiResponse<Void> tempImageCleanup() {
        log.info("[스케줄러] temp-image-cleanup 실행");
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        tempImageService.cleanupExpiredImages(threshold);
        return ApiResponse.ok();
    }

    @Operation(summary = "구글 Places 사진 캐시 갱신 (4일마다 04:00)")
    @PostMapping("/places-photo-warmup")
    @ResponseStatus(HttpStatus.OK)
    @SchedulerLock(
            name = "schedulerController_placesPhotoWarmup",
            lockAtMostFor = "PT30M",
            lockAtLeastFor = "PT1M")
    public ApiResponse<Void> placesPhotoWarmup() {
        log.info("[스케줄러] places-photo-warmup 실행");
        googlePlacesUpdateService.warmAllPhotoCaches();
        return ApiResponse.ok();
    }

    @Operation(summary = "카카오 로컬 기준 전체 빵집 정보 최신화 (매월 1일 05:00)")
    @PostMapping("/bakery-sync-kakao")
    @ResponseStatus(HttpStatus.OK)
    @SchedulerLock(
            name = "schedulerController_bakerySyncKakao",
            lockAtMostFor = "PT1H",
            lockAtLeastFor = "PT1M")
    public ApiResponse<Void> bakerySyncKakao() {
        log.info("[스케줄러] bakery-sync-kakao 실행");
        kakaoLocalUpdateService.syncAllBakeries();
        return ApiResponse.ok();
    }
}

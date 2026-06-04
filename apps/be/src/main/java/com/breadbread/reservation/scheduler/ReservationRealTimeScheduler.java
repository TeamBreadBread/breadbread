package com.breadbread.reservation.scheduler;

import com.breadbread.reservation.service.ReservationRealTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservationRealTimeScheduler {

    private final ReservationRealTimeService reservationRealTimeService;

    /** 매시간 0분/30분 — 1시간 전 알림 + tourService.startTour 호출 */
    @Scheduled(cron = "0 0,30 * * * *", zone = "Asia/Seoul")
    public void runHourly() {
        reservationRealTimeService.processHourlyEvents();
    }

    /** 매시간 20분/50분 — 10분 전 알림 */
    @Scheduled(cron = "0 20,50 * * * *", zone = "Asia/Seoul")
    public void runTenMin() {
        reservationRealTimeService.processTenMinEvents();
    }
}

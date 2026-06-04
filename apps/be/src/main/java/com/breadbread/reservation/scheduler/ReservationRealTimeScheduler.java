package com.breadbread.reservation.scheduler;

import com.breadbread.reservation.service.ReservationRealTimeService;
import lombok.RequiredArgsConstructor;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservationRealTimeScheduler {

    private final ReservationRealTimeService reservationRealTimeService;

    /** 매시간 0분/30분 — 1시간 전 알림 + tourService.startTour 호출 */
    @Scheduled(cron = "0 0,30 * * * *", zone = "Asia/Seoul")
    @SchedulerLock(
            name = "reservationRealTimeScheduler_hourly",
            lockAtMostFor = "PT25M",
            lockAtLeastFor = "PT1M")
    public void runHourly() {
        reservationRealTimeService.processHourlyEvents();
    }

    /** 매시간 20분/50분 — 10분 전 알림 */
    @Scheduled(cron = "0 20,50 * * * *", zone = "Asia/Seoul")
    @SchedulerLock(
            name = "reservationRealTimeScheduler_tenMin",
            lockAtMostFor = "PT15M",
            lockAtLeastFor = "PT1M")
    public void runTenMin() {
        reservationRealTimeService.processTenMinEvents();
    }
}

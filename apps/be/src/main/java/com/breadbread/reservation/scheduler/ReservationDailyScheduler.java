package com.breadbread.reservation.scheduler;

import com.breadbread.reservation.service.ReservationDailyService;
import lombok.RequiredArgsConstructor;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservationDailyScheduler {

    private final ReservationDailyService reservationDailyService;

    @Scheduled(cron = "0 0 9 * * *", zone = "Asia/Seoul")
    @SchedulerLock(
            name = "reservationDailyScheduler",
            lockAtMostFor = "PT10M",
            lockAtLeastFor = "PT1M")
    public void run() {
        reservationDailyService.cancelExpiredPending();
        reservationDailyService.notifyTodayConfirmed();
    }
}

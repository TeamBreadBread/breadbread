package com.breadbread.reservation.scheduler;

import com.breadbread.reservation.service.ReservationDailyService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservationDailyScheduler {

    private final ReservationDailyService reservationDailyService;

    public void run() {
        reservationDailyService.cancelExpiredPending();
        reservationDailyService.notifyTodayConfirmed();
    }
}

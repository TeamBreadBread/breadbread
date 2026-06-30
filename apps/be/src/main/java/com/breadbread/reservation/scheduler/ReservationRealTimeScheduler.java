package com.breadbread.reservation.scheduler;

import com.breadbread.reservation.service.ReservationRealTimeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ReservationRealTimeScheduler {

    private final ReservationRealTimeService reservationRealTimeService;

    /** 매시간 0분/30분 — 1시간 전 알림 + tourService.startTour 호출 */
    public void runHourly() {
        reservationRealTimeService.processHourlyEvents();
    }

    /** 매시간 20분/50분 — 10분 전 알림 */
    public void runTenMin() {
        reservationRealTimeService.processTenMinEvents();
    }
}

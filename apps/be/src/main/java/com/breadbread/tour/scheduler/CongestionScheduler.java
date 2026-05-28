package com.breadbread.tour.scheduler;

import com.breadbread.tour.service.CongestionCheckService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class CongestionScheduler {

    private final CongestionCheckService congestionCheckService;

    @Scheduled(fixedDelay = 5 * 60 * 1000) // 5분
    public void run() {
        log.info("[혼잡도 스케줄러] 실행 시작");
        congestionCheckService.checkAndNotify();
        log.info("[혼잡도 스케줄러] 실행 완료");
    }
}

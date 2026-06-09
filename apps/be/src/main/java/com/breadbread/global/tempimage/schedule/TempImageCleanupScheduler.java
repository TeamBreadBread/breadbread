package com.breadbread.global.tempimage.schedule;

import com.breadbread.global.tempimage.service.TempImageService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TempImageCleanupScheduler {

    private final TempImageService tempImageService;

    @Scheduled(cron = "${temp-image.cleanup-cron:0 0 4 * * *}", zone = "Asia/Seoul")
    @SchedulerLock(
            name = "tempImageCleanupScheduler",
            lockAtMostFor = "PT10M",
            lockAtLeastFor = "PT1M")
    public void cleanupExpiredTempImages() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        log.debug("Temp image cleanup scheduler running: threshold={}", threshold);
        tempImageService.cleanupExpiredImages(threshold);
    }
}

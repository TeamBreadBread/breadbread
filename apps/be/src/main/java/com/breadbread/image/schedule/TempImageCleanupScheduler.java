package com.breadbread.image.schedule;

import com.breadbread.image.service.TempImageService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TempImageCleanupScheduler {

    private final TempImageService tempImageService;

    public void cleanupExpiredTempImages() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        log.debug("Temp image cleanup scheduler running: threshold={}", threshold);
        tempImageService.cleanupExpiredImages(threshold);
    }
}

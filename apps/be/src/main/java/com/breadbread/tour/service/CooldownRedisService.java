package com.breadbread.tour.service;

import java.time.Duration;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CooldownRedisService {

    private final StringRedisTemplate stringRedisTemplate;

    private static final String COOLDOWN_PREFIX = "tour:cooldown:";
    private static final Duration COOLDOWN_TTL = Duration.ofHours(1);

    private static final String PROCESSING_LOCK_PREFIX = "tour:processing_lock:";
    // 웹훅 타임아웃(기본 90s)보다 길게 설정해야 인스턴스 장애 시 데드락이 생기지 않는다.
    private static final Duration PROCESSING_LOCK_TTL = Duration.ofSeconds(120);

    private static final String PRE_DEPARTURE_PREFIX = "tour:pre_departure:";
    private static final Duration PRE_DEPARTURE_TTL = Duration.ofHours(3);

    private static final String CONGESTION_PRE_DEPARTURE_PREFIX = "tour:congestion_pre_dep:";
    private static final Duration CONGESTION_PRE_DEPARTURE_TTL = Duration.ofHours(3);

    // 쿨다운
    public boolean isOnCooldown(Long userId, Long bakeryId) {
        return stringRedisTemplate.hasKey(COOLDOWN_PREFIX + userId + ":" + bakeryId);
    }

    public void markAttempted(Long userId, Long bakeryId) {
        stringRedisTemplate
                .opsForValue()
                .set(COOLDOWN_PREFIX + userId + ":" + bakeryId, "1", COOLDOWN_TTL);
    }

    // 분산 락
    public boolean tryAcquireProcessingLock(Long userId) {
        String key = PROCESSING_LOCK_PREFIX + userId;
        Boolean acquired =
                stringRedisTemplate.opsForValue().setIfAbsent(key, "1", PROCESSING_LOCK_TTL);
        return Boolean.TRUE.equals(acquired);
    }

    // 출발 전 알림
    public boolean isPreDepartureNotified(Long userId, Long reservationId) {
        return stringRedisTemplate.hasKey(PRE_DEPARTURE_PREFIX + userId + ":" + reservationId);
    }

    public void markPreDepartureNotified(Long userId, Long reservationId) {
        stringRedisTemplate
                .opsForValue()
                .set(PRE_DEPARTURE_PREFIX + userId + ":" + reservationId, "1", PRE_DEPARTURE_TTL);
    }

    // 출발 전 혼잡도 체크

    public boolean isPreDepartureCongestionChecked(Long userId, Long reservationId) {
        return stringRedisTemplate.hasKey(
                CONGESTION_PRE_DEPARTURE_PREFIX + userId + ":" + reservationId);
    }

    public void markPreDepartureCongestionChecked(Long userId, Long reservationId) {
        stringRedisTemplate
                .opsForValue()
                .set(
                        CONGESTION_PRE_DEPARTURE_PREFIX + userId + ":" + reservationId,
                        "1",
                        CONGESTION_PRE_DEPARTURE_TTL);
    }
}

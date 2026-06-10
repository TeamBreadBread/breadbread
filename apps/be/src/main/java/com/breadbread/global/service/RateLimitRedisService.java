package com.breadbread.global.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitRedisService {
    private final StringRedisTemplate stringRedisTemplate;

    public void checkLimit(String key, long ttlSeconds, long maxRequests) {
        Long count;
        try {
            count = stringRedisTemplate.opsForValue().increment(key);
            if (count != null && count == 1L) {
                stringRedisTemplate.expire(key, Duration.ofSeconds(ttlSeconds));
            }
        } catch (Exception e) {
            log.warn("Rate limit Redis 오류 — fail-open으로 요청 통과: key={}", key, e);
            return;
        }

        if (count != null && count > maxRequests) {
            Long remainingMillis = stringRedisTemplate.getExpire(key, TimeUnit.MILLISECONDS);
            long retryAfter =
                    (remainingMillis != null && remainingMillis > 0)
                            ? (long) Math.ceil(remainingMillis / 1000.0)
                            : ttlSeconds;
            throw new CustomException(ErrorCode.TOO_MANY_REQUESTS, retryAfter);
        }
    }
}

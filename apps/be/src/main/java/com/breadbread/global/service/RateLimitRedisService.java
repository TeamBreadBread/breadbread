package com.breadbread.global.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.time.Duration;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class RateLimitRedisService {
    private final StringRedisTemplate stringRedisTemplate;

    public void checkLimit(String key, long ttlSeconds, long maxRequests) {
        Long count = stringRedisTemplate.opsForValue().increment(key);

        if (count != null && count == 1L) {
            stringRedisTemplate.expire(key, Duration.ofSeconds(ttlSeconds));
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

package com.breadbread.auth.service;

import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenRedisService {

    private static final String TOKEN_PREFIX = "auth:refresh:";
    private static final String USER_PREFIX = "auth:user-refresh:";

    private final StringRedisTemplate stringRedisTemplate;

    public void save(String hashedToken, String userId, long ttlSeconds) {
        Duration ttl = Duration.ofSeconds(ttlSeconds);
        stringRedisTemplate.opsForValue().set(TOKEN_PREFIX + hashedToken, userId, ttl);
        stringRedisTemplate.opsForValue().set(USER_PREFIX + userId, hashedToken, ttl);
        log.debug("리프레시 토큰 저장 ttl={}s", ttlSeconds);
    }

    public Optional<String> findUserIdByToken(String hashedToken) {
        return Optional.ofNullable(
                stringRedisTemplate.opsForValue().get(TOKEN_PREFIX + hashedToken));
    }

    public void deleteByUserId(String userId) {
        String hashedToken = stringRedisTemplate.opsForValue().get(USER_PREFIX + userId);
        if (hashedToken != null) {
            stringRedisTemplate.delete(TOKEN_PREFIX + hashedToken);
        }
        stringRedisTemplate.delete(USER_PREFIX + userId);
        log.debug("리프레시 토큰 삭제");
    }

    public void deleteByToken(String hashedToken) {
        String userId = stringRedisTemplate.opsForValue().get(TOKEN_PREFIX + hashedToken);
        if (userId != null) {
            stringRedisTemplate.delete(USER_PREFIX + userId);
        }
        stringRedisTemplate.delete(TOKEN_PREFIX + hashedToken);
        log.debug("리프레시 토큰 삭제 by token");
    }
}

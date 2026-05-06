package com.breadbread.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class NaverStateRedisService {
	private static final String STATE_PREFIX = "auth:naver-state:";

	private final StringRedisTemplate stringRedisTemplate;

	public void save(String state,long ttlSeconds){
		Duration ttl = Duration.ofSeconds(ttlSeconds);
		stringRedisTemplate.opsForValue().set(STATE_PREFIX + state, "NAVER", ttl);
	}

	public boolean consume(String state) {
		String value = stringRedisTemplate.opsForValue().getAndDelete(STATE_PREFIX + state);
		return value != null;
	}
}

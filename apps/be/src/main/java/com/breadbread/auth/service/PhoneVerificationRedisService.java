package com.breadbread.auth.service;

import com.breadbread.auth.entity.VerificationPurpose;
import com.breadbread.auth.redis.PhoneVerificationCache;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhoneVerificationRedisService {

	private final StringRedisTemplate stringRedisTemplate;
	private final ObjectMapper objectMapper;

	private static final String PHONE_PREFIX = "auth:phone:";
	private static final String TOKEN_PREFIX = "auth:phone-token:";

	public void savePending(String phone, VerificationPurpose purpose, String code, long ttlSeconds) {
		PhoneVerificationCache value = PhoneVerificationCache.builder()
			.phone(phone)
			.code(code)
			.purpose(purpose)
			.verified(false)
			.verificationToken(null)
			.build();

		savePhoneVerification(buildPhoneKey(phone, purpose), value, Duration.ofSeconds(ttlSeconds));
		log.debug("인증코드 저장 purpose={} ttl={}s", purpose, ttlSeconds);
	}

	public Optional<PhoneVerificationCache> findByPhoneAndPurpose(String phone, VerificationPurpose purpose) {
		String key = buildPhoneKey(phone, purpose);
		String value = stringRedisTemplate.opsForValue().get(key);

		if (value == null) {
			return Optional.empty();
		}

		return Optional.of(readValue(value));
	}

	public void markVerified(String phone, VerificationPurpose purpose, String verificationToken, long verifiedTtlSeconds) {
		String phoneKey = buildPhoneKey(phone, purpose);

		PhoneVerificationCache current = findByPhoneAndPurpose(phone, purpose)
			.orElseThrow(() -> new CustomException(ErrorCode.VERIFICATION_NOT_FOUND));

		PhoneVerificationCache verifiedValue = PhoneVerificationCache.builder()
			.phone(current.getPhone())
			.code(current.getCode())
			.purpose(current.getPurpose())
			.verified(true)
			.verificationToken(verificationToken)
			.build();

		savePhoneVerification(phoneKey, verifiedValue, Duration.ofSeconds(verifiedTtlSeconds));

		String tokenKey = buildTokenKey(verificationToken);
		stringRedisTemplate.opsForValue().set(tokenKey, phoneKey, Duration.ofSeconds(verifiedTtlSeconds));
		log.debug("인증 완료 처리 purpose={} ttl={}s", purpose, verifiedTtlSeconds);
	}

	public Optional<PhoneVerificationCache> findByVerificationToken(String token) {
		String tokenKey = buildTokenKey(token);
		String phoneKey = stringRedisTemplate.opsForValue().get(tokenKey);

		if (phoneKey == null) {
			return Optional.empty();
		}

		String value = stringRedisTemplate.opsForValue().get(phoneKey);
		if (value == null) {
			return Optional.empty();
		}

		return Optional.of(readValue(value));
	}

	public void deleteByPhoneAndPurpose(String phone, VerificationPurpose purpose) {
		PhoneVerificationCache current = findByPhoneAndPurpose(phone, purpose).orElse(null);
		if (current != null && current.getVerificationToken() != null) {
			stringRedisTemplate.delete(buildTokenKey(current.getVerificationToken()));
		}

		stringRedisTemplate.delete(buildPhoneKey(phone, purpose));
		log.debug("인증 데이터 삭제 purpose={}", purpose);
	}

	public void deleteByVerificationToken(String token) {
		String tokenKey = buildTokenKey(token);
		String phoneKey = stringRedisTemplate.opsForValue().get(tokenKey);

		if (phoneKey != null) {
			stringRedisTemplate.delete(phoneKey);
		}
		stringRedisTemplate.delete(tokenKey);
		log.debug("인증 토큰 삭제");
	}

	private String buildPhoneKey(String phone, VerificationPurpose purpose) {
		return PHONE_PREFIX + purpose.name() + ":" + phone;
	}

	private String buildTokenKey(String token) {
		return TOKEN_PREFIX + token;
	}

	private void savePhoneVerification(String key, PhoneVerificationCache value, Duration ttl) {
		try {
			String json = objectMapper.writeValueAsString(value);
			stringRedisTemplate.opsForValue().set(key, json, ttl);
		} catch (JsonProcessingException e) {
			log.error("휴대전화 인증 Redis 직렬화 실패 purpose={}", value.getPurpose(), e);
			throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}

	private PhoneVerificationCache readValue(String json) {
		try {
			return objectMapper.readValue(json, PhoneVerificationCache.class);
		} catch (JsonProcessingException e) {
			log.error("휴대전화 인증 Redis 역직렬화 실패", e);
			throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
		}
	}
}

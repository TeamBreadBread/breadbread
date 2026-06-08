package com.breadbread.course.service.ai;

import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiCourseResultCache;
import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.global.config.AiProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiCourseResultRedisService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;

    private static final String RESULT_PREFIX = "ai:result:";

    public void saveResult(
            String jobId, Long userId, AiCourseRequest request, AiCourseWebhookResponse response) {
        AiCourseResultCache cache =
                AiCourseResultCache.builder()
                        .userId(userId)
                        .request(request)
                        .response(response)
                        .build();
        try {
            stringRedisTemplate
                    .opsForValue()
                    .set(
                            RESULT_PREFIX + jobId,
                            objectMapper.writeValueAsString(cache),
                            Duration.ofHours(aiProperties.getJobTtlHours()));
        } catch (JsonProcessingException e) {
            log.error("AI 결과 Redis 직렬화 실패 jobId={}", jobId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public Optional<AiCourseResultCache> getResult(String jobId, Long requesterId) {
        String json = stringRedisTemplate.opsForValue().get(RESULT_PREFIX + jobId);
        if (json == null) return Optional.empty();
        try {
            AiCourseResultCache cache = objectMapper.readValue(json, AiCourseResultCache.class);
            if (!cache.getUserId().equals(requesterId)) {
                throw new CustomException(ErrorCode.FORBIDDEN);
            }
            return Optional.of(cache);
        } catch (JsonProcessingException e) {
            log.error("AI 결과 Redis 역직렬화 실패 jobId={}", jobId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public void deleteResult(String jobId) {
        stringRedisTemplate.delete(RESULT_PREFIX + jobId);
    }

    /** 저장 진행 중 락을 SET NX EX로 획득한다. 이미 다른 요청이 저장 중이면 false를 반환해 중복 저장을 방지한다. */
    public boolean tryAcquireSaveLock(String jobId) {
        Boolean acquired =
                stringRedisTemplate
                        .opsForValue()
                        .setIfAbsent(RESULT_PREFIX + jobId + ":saving", "1", Duration.ofMinutes(5));
        return Boolean.TRUE.equals(acquired);
    }

    /** 저장 락을 해제한다. DB 실패 시 즉시 해제해 재시도를 허용한다. */
    public void releaseSaveLock(String jobId) {
        stringRedisTemplate.delete(RESULT_PREFIX + jobId + ":saving");
    }
}

package com.breadbread.course.service.ai;

import com.breadbread.course.dto.ai.AiJobCache;
import com.breadbread.course.dto.ai.AiJobStatus;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
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
public class AiCourseRedisService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;

    private static final String JOB_PREFIX = "ai:job:";

    public void savePending(String jobId, Long userId) {
        save(jobId, AiJobCache.builder().status(AiJobStatus.PENDING).userId(userId).build());
    }

    public void saveCompleted(String jobId, Long courseId) {
        AiJobCache current = findCacheByJobId(jobId).orElse(null);
        save(
                jobId,
                AiJobCache.builder()
                        .status(AiJobStatus.COMPLETED)
                        .courseId(courseId)
                        .userId(current != null ? current.getUserId() : null)
                        .build());
    }

    public void saveFailed(String jobId, String errorMessage) {
        AiJobCache current = findCacheByJobId(jobId).orElse(null);
        save(
                jobId,
                AiJobCache.builder()
                        .status(AiJobStatus.FAILED)
                        .errorMessage(errorMessage)
                        .userId(current != null ? current.getUserId() : null)
                        .build());
    }

    public Optional<AiJobStatusResponse> findByJobId(String jobId, Long requesterId) {
        return findCacheByJobId(jobId)
                .map(
                        cache -> {
                            if (cache.getUserId() == null
                                    || !cache.getUserId().equals(requesterId)) {
                                throw new CustomException(ErrorCode.FORBIDDEN);
                            }
                            return new AiJobStatusResponse(
                                    cache.getStatus(),
                                    cache.getCourseId(),
                                    cache.getErrorMessage());
                        });
    }

    private Optional<AiJobCache> findCacheByJobId(String jobId) {
        String json = stringRedisTemplate.opsForValue().get(JOB_PREFIX + jobId);
        if (json == null) return Optional.empty();
        try {
            return Optional.of(objectMapper.readValue(json, AiJobCache.class));
        } catch (JsonProcessingException e) {
            log.error("AI 잡 Redis 역직렬화 실패 jobId={}", jobId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    private void save(String jobId, AiJobCache value) {
        try {
            stringRedisTemplate
                    .opsForValue()
                    .set(
                            JOB_PREFIX + jobId,
                            objectMapper.writeValueAsString(value),
                            Duration.ofHours(aiProperties.getJobTtlHours()));
        } catch (JsonProcessingException e) {
            log.error("AI 잡 Redis 직렬화 실패 jobId={}", jobId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}

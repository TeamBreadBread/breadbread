package com.breadbread.course.service.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.course.dto.ai.AiJobStatus;
import com.breadbread.global.config.AiProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class AiCourseRedisServiceTest {

    @Mock private StringRedisTemplate stringRedisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private AiProperties aiProperties;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private AiCourseRedisService aiCourseRedisService;

    @BeforeEach
    void wireMapper() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        aiCourseRedisService =
                new AiCourseRedisService(stringRedisTemplate, objectMapper, aiProperties);
    }

    @Test
    void savePending_writes_json_whenTtlConfigured() {
        when(aiProperties.getJobTtlHours()).thenReturn(24L);
        aiCourseRedisService.savePending("job-1", 9L);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);
        verify(valueOps).set(keyCaptor.capture(), jsonCaptor.capture(), ttlCaptor.capture());
        assertThat(keyCaptor.getValue()).isEqualTo("ai:job:job-1");
        assertThat(jsonCaptor.getValue())
                .contains("\"status\":\"PENDING\"")
                .contains("\"userId\":9");
        assertThat(ttlCaptor.getValue()).isEqualTo(Duration.ofHours(24));
    }

    @Test
    void findByJobId_returnsResponse_whenRequesterMatches() throws Exception {
        String json =
                objectMapper.writeValueAsString(
                        com.breadbread.course.dto.ai.AiJobCache.builder()
                                .status(AiJobStatus.COMPLETED)
                                .courseId(100L)
                                .userId(5L)
                                .build());
        when(valueOps.get("ai:job:job-x")).thenReturn(json);

        var result = aiCourseRedisService.findByJobId("job-x", 5L);

        assertThat(result).isPresent();
        assertThat(result.get().getStatus()).isEqualTo(AiJobStatus.COMPLETED);
        assertThat(result.get().getCourseId()).isEqualTo(100L);
    }

    @Test
    void findByJobId_returns_empty_whenKeyMissing() {
        when(valueOps.get("ai:job:missing")).thenReturn(null);

        assertThat(aiCourseRedisService.findByJobId("missing", 1L)).isEmpty();
    }

    @Test
    void findByJobId_throws_forbidden_when_requester_mismatch() throws Exception {
        String json =
                objectMapper.writeValueAsString(
                        com.breadbread.course.dto.ai.AiJobCache.builder()
                                .status(AiJobStatus.PENDING)
                                .userId(5L)
                                .build());
        when(valueOps.get("ai:job:job-y")).thenReturn(json);

        assertThatThrownBy(() -> aiCourseRedisService.findByJobId("job-y", 99L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void saveCompleted_keeps_user_id_whenPendingSnapshotExists() throws Exception {
        when(aiProperties.getJobTtlHours()).thenReturn(24L);
        String existing =
                objectMapper.writeValueAsString(
                        com.breadbread.course.dto.ai.AiJobCache.builder()
                                .status(AiJobStatus.PENDING)
                                .userId(3L)
                                .build());
        when(valueOps.get("ai:job:job-z")).thenReturn(existing);

        aiCourseRedisService.saveCompleted("job-z", 200L);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOps).set(eq("ai:job:job-z"), jsonCaptor.capture(), any(Duration.class));
        assertThat(jsonCaptor.getValue())
                .contains("\"status\":\"COMPLETED\"")
                .contains("\"courseId\":200")
                .contains("\"userId\":3");
    }
}

package com.breadbread.tour.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TourRedisServiceTest {

    @Mock private StringRedisTemplate stringRedisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private SetOperations<String, String> setOps;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private TourRedisService tourRedisService;

    @BeforeEach
    void setUp() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        when(stringRedisTemplate.opsForSet()).thenReturn(setOps);
        tourRedisService = new TourRedisService(stringRedisTemplate, objectMapper);
    }

    // ── startTour ──────────────────────────────────────────────────────────────

    @Test
    void startTour_saves_IN_PROGRESS_state_with_24h_ttl_and_adds_to_active_set() {
        TourStateCache result = tourRedisService.startTour(1L, 10L, 3);

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOps).set(keyCaptor.capture(), jsonCaptor.capture(), eq(Duration.ofHours(24)));
        assertThat(keyCaptor.getValue()).isEqualTo("tour:1");
        assertThat(jsonCaptor.getValue())
                .contains("\"status\":\"IN_PROGRESS\"")
                .contains("\"courseId\":10")
                .contains("\"totalBakeryCount\":3")
                .contains("\"currentVisitOrder\":0");
        verify(setOps).add("tour:active", "1");
        // 반환된 상태가 Redis 재조회 없이 직접 사용 가능한지 확인
        assertThat(result.getStatus()).isEqualTo(TourStatus.IN_PROGRESS);
        assertThat(result.getCourseId()).isEqualTo(10L);
        assertThat(result.getCurrentVisitOrder()).isEqualTo(0);
    }

    // ── updateVisitOrder ───────────────────────────────────────────────────────

    @Test
    void updateVisitOrder_keeps_IN_PROGRESS_and_24h_ttl_when_not_last_bakery() throws Exception {
        when(valueOps.get("tour:1")).thenReturn(json(1L, 10L, 3, 1, TourStatus.IN_PROGRESS));

        TourStateCache updated = tourRedisService.updateVisitOrder(1L, 2);

        assertThat(updated.getCurrentVisitOrder()).isEqualTo(2);
        assertThat(updated.getStatus()).isEqualTo(TourStatus.IN_PROGRESS);
        verify(valueOps).set(eq("tour:1"), any(), eq(Duration.ofHours(24)));
        verify(setOps, never()).remove(any(), any());
    }

    @Test
    void updateVisitOrder_sets_COMPLETED_with_1h_ttl_and_removes_from_active_set_when_last_bakery()
            throws Exception {
        when(valueOps.get("tour:1")).thenReturn(json(1L, 10L, 3, 2, TourStatus.IN_PROGRESS));

        TourStateCache updated = tourRedisService.updateVisitOrder(1L, 3);

        assertThat(updated.getStatus()).isEqualTo(TourStatus.COMPLETED);
        assertThat(updated.getCurrentVisitOrder()).isEqualTo(3);
        verify(valueOps).set(eq("tour:1"), any(), eq(Duration.ofHours(1)));
        verify(setOps).remove("tour:active", "1");
    }

    // ── getTourState ───────────────────────────────────────────────────────────

    @Test
    void getTourState_returns_deserialized_state_when_key_exists() throws Exception {
        when(valueOps.get("tour:1")).thenReturn(json(1L, 10L, 3, 1, TourStatus.IN_PROGRESS));

        Optional<TourStateCache> result = tourRedisService.getTourState(1L);

        assertThat(result).isPresent();
        assertThat(result.get().getCourseId()).isEqualTo(10L);
        assertThat(result.get().getStatus()).isEqualTo(TourStatus.IN_PROGRESS);
        assertThat(result.get().getCurrentVisitOrder()).isEqualTo(1);
    }

    @Test
    void getTourState_returns_empty_when_key_missing() {
        when(valueOps.get("tour:1")).thenReturn(null);

        assertThat(tourRedisService.getTourState(1L)).isEmpty();
    }

    // ── hasActiveTour ──────────────────────────────────────────────────────────

    @Test
    void hasActiveTour_returns_true_when_IN_PROGRESS() throws Exception {
        when(valueOps.get("tour:1")).thenReturn(json(1L, 10L, 3, 1, TourStatus.IN_PROGRESS));

        assertThat(tourRedisService.hasActiveTour(1L)).isTrue();
    }

    @Test
    void hasActiveTour_returns_false_when_COMPLETED() throws Exception {
        when(valueOps.get("tour:1")).thenReturn(json(1L, 10L, 3, 3, TourStatus.COMPLETED));

        assertThat(tourRedisService.hasActiveTour(1L)).isFalse();
    }

    @Test
    void hasActiveTour_returns_false_when_no_state() {
        when(valueOps.get("tour:1")).thenReturn(null);

        assertThat(tourRedisService.hasActiveTour(1L)).isFalse();
    }

    // ── completeTour ───────────────────────────────────────────────────────────

    @Test
    void completeTour_sets_currentVisitOrder_to_total_and_saves_COMPLETED_with_1h_ttl()
            throws Exception {
        when(valueOps.get("tour:1")).thenReturn(json(1L, 10L, 3, 1, TourStatus.IN_PROGRESS));

        TourStateCache result = tourRedisService.completeTour(1L);

        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        verify(valueOps).set(eq("tour:1"), jsonCaptor.capture(), eq(Duration.ofHours(1)));
        assertThat(jsonCaptor.getValue())
                .contains("\"status\":\"COMPLETED\"")
                .contains("\"currentVisitOrder\":3"); // totalBakeryCount = 3
        verify(setOps).remove("tour:active", "1");
        assertThat(result.getStatus()).isEqualTo(TourStatus.COMPLETED);
        assertThat(result.getCurrentVisitOrder()).isEqualTo(3);
        assertThat(result.getTotalBakeryCount() - result.getCurrentVisitOrder()).isZero();
    }

    // ── getAllActiveUserIds ─────────────────────────────────────────────────────

    @Test
    void getAllActiveUserIds_returns_only_IN_PROGRESS_users() throws Exception {
        when(setOps.members("tour:active")).thenReturn(Set.of("1", "2"));
        when(valueOps.get("tour:1")).thenReturn(json(1L, 10L, 3, 1, TourStatus.IN_PROGRESS));
        when(valueOps.get("tour:2")).thenReturn(json(2L, 10L, 3, 3, TourStatus.COMPLETED));

        List<Long> result = tourRedisService.getAllActiveUserIds();

        assertThat(result).containsExactly(1L);
        verify(setOps).remove("tour:active", "2"); // COMPLETED 항목 정리
    }

    @Test
    void getAllActiveUserIds_cleans_up_stale_entries_whose_state_key_expired() throws Exception {
        when(setOps.members("tour:active")).thenReturn(Set.of("1"));
        when(valueOps.get("tour:1")).thenReturn(null); // TTL 만료

        List<Long> result = tourRedisService.getAllActiveUserIds();

        assertThat(result).isEmpty();
        verify(setOps).remove("tour:active", "1");
    }

    @Test
    void getAllActiveUserIds_returns_empty_when_active_set_is_null() {
        when(setOps.members("tour:active")).thenReturn(null);

        assertThat(tourRedisService.getAllActiveUserIds()).isEmpty();
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private String json(Long userId, Long courseId, int total, int current, TourStatus status)
            throws Exception {
        return objectMapper.writeValueAsString(
                TourStateCache.builder()
                        .userId(userId)
                        .courseId(courseId)
                        .totalBakeryCount(total)
                        .currentVisitOrder(current)
                        .status(status)
                        .startedAt("2026-01-01T10:00:00")
                        .build());
    }
}

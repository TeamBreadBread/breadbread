package com.breadbread.tour.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class TourRedisService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOUR_PREFIX = "tour:";
    private static final String ACTIVE_SET_KEY = "tour:active";
    private static final Duration TOUR_TTL = Duration.ofHours(24);

    public TourStateCache startTour(Long userId, Long courseId, int totalBakeryCount) {
        TourStateCache state =
                TourStateCache.builder()
                        .userId(userId)
                        .courseId(courseId)
                        .totalBakeryCount(totalBakeryCount)
                        .currentVisitOrder(0)
                        .status(TourStatus.IN_PROGRESS)
                        .startedAt(LocalDateTime.now().toString())
                        .build();
        save(userId, state, TOUR_TTL);
        stringRedisTemplate.opsForSet().add(ACTIVE_SET_KEY, String.valueOf(userId));
        log.info("[투어] 시작: userId={}, courseId={}", userId, courseId);
        return state;
    }

    public TourStateCache updateVisitOrder(Long userId, int visitedOrder) {
        TourStateCache current =
                getTourState(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.TOUR_NOT_FOUND));

        boolean isCompleted = visitedOrder >= current.getTotalBakeryCount();
        TourStateCache updated =
                TourStateCache.builder()
                        .userId(userId)
                        .courseId(current.getCourseId())
                        .totalBakeryCount(current.getTotalBakeryCount())
                        .currentVisitOrder(visitedOrder)
                        .status(isCompleted ? TourStatus.COMPLETED : TourStatus.IN_PROGRESS)
                        .startedAt(current.getStartedAt())
                        .build();

        Duration ttl = isCompleted ? Duration.ofHours(1) : TOUR_TTL;
        save(userId, updated, ttl);

        if (isCompleted) {
            stringRedisTemplate.opsForSet().remove(ACTIVE_SET_KEY, String.valueOf(userId));
            log.info("[투어] 완료: userId={}, courseId={}", userId, current.getCourseId());
        }
        return updated;
    }

    public Optional<TourStateCache> getTourState(Long userId) {
        String json = stringRedisTemplate.opsForValue().get(TOUR_PREFIX + userId);
        if (json == null) return Optional.empty();
        try {
            return Optional.of(objectMapper.readValue(json, TourStateCache.class));
        } catch (JsonProcessingException e) {
            log.error("[투어] Redis 역직렬화 실패: userId={}", userId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    public boolean hasActiveTour(Long userId) {
        return getTourState(userId)
                .map(state -> state.getStatus() == TourStatus.IN_PROGRESS)
                .orElse(false);
    }

    public TourStateCache completeTour(Long userId) {
        TourStateCache current =
                getTourState(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.TOUR_NOT_FOUND));

        TourStateCache completed =
                TourStateCache.builder()
                        .userId(userId)
                        .courseId(current.getCourseId())
                        .totalBakeryCount(current.getTotalBakeryCount())
                        .currentVisitOrder(current.getTotalBakeryCount()) // remainingCount = 0 보장
                        .status(TourStatus.COMPLETED)
                        .startedAt(current.getStartedAt())
                        .build();

        save(userId, completed, Duration.ofHours(1));
        stringRedisTemplate.opsForSet().remove(ACTIVE_SET_KEY, String.valueOf(userId));
        log.info("[투어] 수동 완료: userId={}, courseId={}", userId, current.getCourseId());
        return completed;
    }

    public List<Long> getAllActiveUserIds() {
        Set<String> members = stringRedisTemplate.opsForSet().members(ACTIVE_SET_KEY);
        if (members == null) return List.of();

        List<Long> activeIds = new java.util.ArrayList<>();
        for (String s : members) {
            Long userId;
            try {
                userId = Long.parseLong(s);
            } catch (NumberFormatException e) {
                stringRedisTemplate.opsForSet().remove(ACTIVE_SET_KEY, s);
                continue;
            }

            Optional<TourStateCache> state = getTourState(userId);
            if (state.isEmpty()) {
                // TTL 만료 등으로 상태 키가 사라진 stale 항목 정리
                stringRedisTemplate.opsForSet().remove(ACTIVE_SET_KEY, s);
                log.warn("[투어] getAllActiveUserIds — stale 항목 제거: userId={}", userId);
                continue;
            }
            if (state.get().getStatus() == TourStatus.IN_PROGRESS) {
                activeIds.add(userId);
            } else {
                // COMPLETED인데 set에 남아 있는 경우 정리
                stringRedisTemplate.opsForSet().remove(ACTIVE_SET_KEY, s);
                log.warn("[투어] getAllActiveUserIds — COMPLETED 잔류 항목 제거: userId={}", userId);
            }
        }
        return activeIds;
    }

    private void save(Long userId, TourStateCache state, Duration ttl) {
        try {
            stringRedisTemplate
                    .opsForValue()
                    .set(TOUR_PREFIX + userId, objectMapper.writeValueAsString(state), ttl);
        } catch (JsonProcessingException e) {
            log.error("[투어] Redis 직렬화 실패: userId={}", userId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}

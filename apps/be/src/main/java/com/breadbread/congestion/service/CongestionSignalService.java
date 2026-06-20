package com.breadbread.congestion.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.congestion.dto.BakeryCongestionSignalAdminListResponse;
import com.breadbread.congestion.dto.BakeryCongestionSignalAdminResponse;
import com.breadbread.congestion.dto.CongestionResponse;
import com.breadbread.congestion.dto.CongestionSignalRequest;
import com.breadbread.congestion.entity.BakeryCongestionSignal;
import com.breadbread.congestion.entity.CongestionLevel;
import com.breadbread.congestion.repository.BakeryCongestionSignalRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.CongestionInstantCheckResponse;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CongestionSignalService {

    private final BakeryCongestionSignalRepository repository;
    private final BakeryRepository bakeryRepository;

    @Transactional
    public void save(CongestionSignalRequest request) {
        String actualName =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(
                                request.getBakeryId(), BakeryStatus.APPROVED)
                        .map(Bakery::getName)
                        .orElse(null);

        if (actualName == null) {
            log.warn(
                    "[혼잡도 신호] 존재하지 않는 빵집 — 스킵: bakeryId={}, bakeryName={}",
                    request.getBakeryId(),
                    request.getBakeryName());
            return;
        }

        if (!actualName.equals(request.getBakeryName())) {
            log.warn(
                    "[혼잡도 신호] 빵집명 불일치 — bakeryId={}, n8n전달={}, 실제={}",
                    request.getBakeryId(),
                    request.getBakeryName(),
                    actualName);
        }

        repository.save(toEntity(request));
        log.info("[혼잡도 신호] 저장 완료: bakeryId={}", request.getBakeryId());
    }

    @Transactional
    public void saveAll(List<CongestionSignalRequest> requests) {
        // bakeryId 기준으로 실제 빵집 일괄 조회
        List<Long> bakeryIds = requests.stream().map(CongestionSignalRequest::getBakeryId).toList();
        Map<Long, String> bakeryNameMap =
                bakeryRepository
                        .findAllByIdInAndActiveTrueAndStatus(bakeryIds, BakeryStatus.APPROVED)
                        .stream()
                        .collect(Collectors.toMap(Bakery::getId, Bakery::getName));

        List<BakeryCongestionSignal> signals = new ArrayList<>();
        for (CongestionSignalRequest req : requests) {
            String actualName = bakeryNameMap.get(req.getBakeryId());

            // bakeryId 존재하지 않으면 스킵
            if (actualName == null) {
                log.warn(
                        "[혼잡도 신호] 존재하지 않는 빵집 — 스킵: bakeryId={}, bakeryName={}",
                        req.getBakeryId(),
                        req.getBakeryName());
                continue;
            }

            // bakeryName 불일치 시 경고 로그 (저장은 허용)
            if (!actualName.equals(req.getBakeryName())) {
                log.warn(
                        "[혼잡도 신호] 빵집명 불일치 — bakeryId={}, n8n전달={}, 실제={}",
                        req.getBakeryId(),
                        req.getBakeryName(),
                        actualName);
            }

            signals.add(toEntity(req));
        }

        if (signals.isEmpty()) {
            log.warn("[혼잡도 신호] 저장 가능한 데이터가 없습니다.");
            return;
        }

        repository.saveAll(signals);
        log.info("[혼잡도 신호] {}건 저장 완료 (요청 {}건 중)", signals.size(), requests.size());
    }

    @Transactional
    public void saveAllFromInstantCheck(
            List<CongestionInstantCheckResponse.CongestionResult> results) {
        saveAllFromInstantCheck(results, null);
    }

    @Transactional
    public void saveAllFromInstantCheck(
            List<CongestionInstantCheckResponse.CongestionResult> results,
            Set<Long> allowedBakeryIds) {
        if (results == null || results.isEmpty()) {
            log.warn("[혼잡도 신호] 저장 가능한 데이터가 없습니다.");
            return;
        }
        List<Long> bakeryIds =
                results.stream()
                        .map(CongestionInstantCheckResponse.CongestionResult::getBakeryId)
                        .filter(id -> id != null)
                        .toList();
        Set<Long> approvedIds =
                bakeryRepository
                        .findAllByIdInAndActiveTrueAndStatus(bakeryIds, BakeryStatus.APPROVED)
                        .stream()
                        .map(Bakery::getId)
                        .collect(Collectors.toSet());

        List<BakeryCongestionSignal> entities =
                results.stream()
                        .filter(
                                r ->
                                        r.getBakeryId() != null
                                                && approvedIds.contains(r.getBakeryId()))
                        .filter(
                                r ->
                                        allowedBakeryIds == null
                                                || allowedBakeryIds.contains(r.getBakeryId()))
                        .map(this::toEntity)
                        .toList();

        if (entities.isEmpty()) {
            log.warn("[혼잡도 신호] 저장 가능한 데이터가 없습니다.");
            return;
        }
        repository.saveAll(entities);
        log.info("[혼잡도 신호] {}건 저장 완료 (응답 {}건 중)", entities.size(), results.size());
    }

    private BakeryCongestionSignal toEntity(
            CongestionInstantCheckResponse.CongestionResult result) {
        CongestionInstantCheckResponse.CongestionResult.Signals s = result.getSignals();
        return BakeryCongestionSignal.builder()
                .bakeryId(result.getBakeryId())
                .bakeryName(result.getBakeryName())
                .congestionScore(result.getCongestionScore())
                .level(parseLevel(result.getLevel()))
                .expectedWaitMin(result.getExpectedWaitMin())
                .reason(result.getReason())
                .waitingKeywordCount(s != null ? s.getWaitingKeywordCount() : null)
                .openRunKeywordCount(s != null ? s.getOpenRunKeywordCount() : null)
                .soldOutKeywordCount(s != null ? s.getSoldOutKeywordCount() : null)
                .recentMentionCount(s != null ? s.getRecentMentionCount() : null)
                .morningMentions(s != null ? s.getMorningMentions() : null)
                .afternoonMentions(s != null ? s.getAfternoonMentions() : null)
                .eveningMentions(s != null ? s.getEveningMentions() : null)
                .collectedAt(result.getCheckedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public CongestionResponse getByBakeryId(Long bakeryId) {
        BakeryCongestionSignal signal =
                repository
                        .findTopByBakeryIdOrderByCollectedAtDescIdDesc(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.CONGESTION_NOT_FOUND));
        return CongestionResponse.from(signal);
    }

    @Transactional(readOnly = true)
    public List<CongestionResponse> getByBakeryIds(List<Long> bakeryIds) {
        return repository.findLatestByBakeryIds(bakeryIds).stream()
                .map(CongestionResponse::from)
                .toList();
    }

    private BakeryCongestionSignal toEntity(CongestionSignalRequest req) {
        CongestionSignalRequest.Signals s = req.getSignals();
        return BakeryCongestionSignal.builder()
                .bakeryId(req.getBakeryId())
                .bakeryName(req.getBakeryName())
                .congestionScore(req.getCongestionScore())
                .level(parseLevel(req.getLevel()))
                .expectedWaitMin(req.getExpectedWaitMin())
                .reason(req.getReason())
                .waitingKeywordCount(s != null ? s.getWaitingKeywordCount() : null)
                .openRunKeywordCount(s != null ? s.getOpenRunKeywordCount() : null)
                .soldOutKeywordCount(s != null ? s.getSoldOutKeywordCount() : null)
                .recentMentionCount(s != null ? s.getRecentMentionCount() : null)
                .morningMentions(s != null ? s.getMorningMentions() : null)
                .afternoonMentions(s != null ? s.getAfternoonMentions() : null)
                .eveningMentions(s != null ? s.getEveningMentions() : null)
                .collectedAt(req.getCollectedAt())
                .build();
    }

    private CongestionLevel parseLevel(String level) {
        if (level == null) return null;
        try {
            return CongestionLevel.valueOf(level.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("[혼잡도 신호] 알 수 없는 level 값: {}", level);
            return null;
        }
    }

    @Transactional(readOnly = true)
    public BakeryCongestionSignalAdminListResponse findAllForAdmin(
            LocalDateTime from, LocalDateTime to, Pageable pageable) {
        LocalDateTime start = from != null ? from : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime end = to != null ? to : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        Page<BakeryCongestionSignal> page =
                repository.findAllByCreatedAtRange(start, end, pageable);
        return BakeryCongestionSignalAdminListResponse.builder()
                .signals(
                        page.getContent().stream()
                                .map(BakeryCongestionSignalAdminResponse::from)
                                .toList())
                .total((int) page.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(page.hasNext())
                .build();
    }
}

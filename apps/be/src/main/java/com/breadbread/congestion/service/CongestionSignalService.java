package com.breadbread.congestion.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.congestion.dto.CongestionResponse;
import com.breadbread.congestion.dto.CongestionSignalRequest;
import com.breadbread.congestion.entity.BakeryCongestionSignal;
import com.breadbread.congestion.entity.CongestionLevel;
import com.breadbread.congestion.repository.BakeryCongestionSignalRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
                        .findByIdAndActiveTrue(request.getBakeryId())
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
                bakeryRepository.findAllByIdInAndActiveTrue(bakeryIds).stream()
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
}

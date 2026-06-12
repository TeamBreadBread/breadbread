package com.breadbread.trend.service;

import com.breadbread.trend.dto.BakeryTrendTagAdminListResponse;
import com.breadbread.trend.dto.BakeryTrendTagAdminResponse;
import com.breadbread.trend.dto.TrendBakeryResponse;
import com.breadbread.trend.dto.TrendBreadResponse;
import com.breadbread.trend.dto.TrendDiscoverRequest;
import com.breadbread.trend.entity.BakeryTrendTag;
import com.breadbread.trend.entity.TrendStatus;
import com.breadbread.trend.repository.BakeryTrendTagRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class TrendService {

    private final BakeryTrendTagRepository repository;
    private final ObjectMapper objectMapper;

    @Transactional
    public void saveAll(List<TrendDiscoverRequest> requests) {
        List<BakeryTrendTag> entities = requests.stream().map(this::toEntity).toList();
        repository.saveAll(entities);
        log.info("[트렌드] 저장 완료: {}건", entities.size());
    }

    @Transactional(readOnly = true)
    public Page<TrendBreadResponse> getBreads(TrendStatus status, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        if (status != null) {
            return repository
                    .findLatestByKeywordAndStatus(status, pageable)
                    .map(TrendBreadResponse::from);
        }
        return repository.findLatestByKeyword(pageable).map(TrendBreadResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<TrendBakeryResponse> getBakeries(String keyword, int page, int size) {
        PageRequest pageable = PageRequest.of(page, size);
        if (keyword != null && !keyword.isBlank()) {
            return repository
                    .findLatestByBakeryAndKeyword(keyword, pageable)
                    .map(TrendBakeryResponse::from);
        }
        return repository.findLatestByBakery(pageable).map(TrendBakeryResponse::from);
    }

    private BakeryTrendTag toEntity(TrendDiscoverRequest req) {
        return BakeryTrendTag.builder()
                .keyword(req.getKeyword())
                .trendScore(req.getTrendScore())
                .trendStatus(parseTrendStatus(req.getTrendStatus()))
                .growthRate(req.getGrowthRate())
                .bakeryId(req.getBakeryId())
                .bakeryName(req.getBakeryName())
                .matchedMenus(toJson(req.getMatchedMenus()))
                .sources(toJson(req.getSource()))
                .collectedAt(req.getCollectedAt())
                .build();
    }

    private TrendStatus parseTrendStatus(String status) {
        if (status == null) return null;
        try {
            return TrendStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            log.warn("[트렌드] 알 수 없는 trendStatus: {}", status);
            return null;
        }
    }

    private String toJson(List<String> list) {
        if (list == null || list.isEmpty()) return null;
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException e) {
            log.warn("[트렌드] JSON 직렬화 실패: {}", list);
            return null;
        }
    }

    @Transactional(readOnly = true)
    public BakeryTrendTagAdminListResponse findAllForAdmin(
            LocalDateTime from, LocalDateTime to, Pageable pageable) {
        LocalDateTime start = from != null ? from : LocalDateTime.of(2000, 1, 1, 0, 0);
        LocalDateTime end = to != null ? to : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        Page<BakeryTrendTag> page = repository.findAllByCreatedAtRange(start, end, pageable);
        return BakeryTrendTagAdminListResponse.builder()
                .tags(page.getContent().stream().map(BakeryTrendTagAdminResponse::from).toList())
                .total((int) page.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(page.hasNext())
                .build();
    }
}

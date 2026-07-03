package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.imports.BakeryImportCache;
import com.breadbread.bakery.dto.imports.BakeryImportCandidate;
import com.breadbread.bakery.dto.response.BakeryImportPreviewResponse;
import com.breadbread.global.config.BakeryImportProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

/** 구글 Places / 카카오 로컬 임포트가 공용으로 쓰는 검색 결과 캐시. 검색 시 후보를 잠시 저장해두고, 관리자가 고른 것만 확정 저장할 때 다시 읽는다. */
@Slf4j
@Service
@RequiredArgsConstructor
public class BakeryImportRedisService {

    private static final String SEARCH_PREFIX = "bakery:import:";

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;
    private final BakeryImportProperties bakeryImportProperties;

    public void saveCandidates(
            String searchId, String keyword, List<BakeryImportCandidate> candidates) {
        BakeryImportCache cache =
                BakeryImportCache.builder().keyword(keyword).candidates(candidates).build();
        try {
            stringRedisTemplate
                    .opsForValue()
                    .set(
                            SEARCH_PREFIX + searchId,
                            objectMapper.writeValueAsString(cache),
                            Duration.ofMinutes(bakeryImportProperties.getCacheTtlMinutes()));
        } catch (JsonProcessingException e) {
            log.error("[빵집 임포트] 캐시 직렬화 실패: searchId={}", searchId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /** searchId로 캐시를 조회한다. 만료/미존재 시 예외를 던진다. */
    public BakeryImportCache getCandidatesOrThrow(String searchId) {
        String json = stringRedisTemplate.opsForValue().get(SEARCH_PREFIX + searchId);
        if (json == null) throw new CustomException(ErrorCode.BAKERY_IMPORT_RESULT_NOT_FOUND);
        try {
            return objectMapper.readValue(json, BakeryImportCache.class);
        } catch (JsonProcessingException e) {
            log.error("[빵집 임포트] 캐시 역직렬화 실패: searchId={}", searchId, e);
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }

    /** 캐시된 검색 결과를 그대로 미리보기 응답 형태로 조회한다 (provider 구분 없이 조회만 하는 용도). */
    public BakeryImportPreviewResponse getPreview(String searchId) {
        BakeryImportCache cache = getCandidatesOrThrow(searchId);
        return BakeryImportPreviewResponse.builder()
                .searchId(searchId)
                .keyword(cache.getKeyword())
                .candidates(cache.getCandidates())
                .build();
    }
}

package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.dto.imports.BakeryImportCache;
import com.breadbread.bakery.dto.imports.BakeryImportCandidate;
import com.breadbread.bakery.dto.response.BakeryImportPreviewResponse;
import com.breadbread.global.config.BakeryImportProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

@ExtendWith(MockitoExtension.class)
class BakeryImportRedisServiceTest {

    @Mock private StringRedisTemplate stringRedisTemplate;
    @Mock private ValueOperations<String, String> valueOps;
    @Mock private BakeryImportProperties bakeryImportProperties;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private BakeryImportRedisService bakeryImportRedisService;

    @BeforeEach
    void wireMapper() {
        when(stringRedisTemplate.opsForValue()).thenReturn(valueOps);
        bakeryImportRedisService =
                new BakeryImportRedisService(
                        stringRedisTemplate, objectMapper, bakeryImportProperties);
    }

    @Test
    void saveCandidates_writes_json_withConfiguredTtl() {
        when(bakeryImportProperties.getCacheTtlMinutes()).thenReturn(30L);
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder().externalId("place-1").name("나무빵집").build();

        bakeryImportRedisService.saveCandidates("search-1", "대전 빵집", List.of(candidate));

        ArgumentCaptor<String> keyCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> jsonCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<Duration> ttlCaptor = ArgumentCaptor.forClass(Duration.class);
        verify(valueOps).set(keyCaptor.capture(), jsonCaptor.capture(), ttlCaptor.capture());
        assertThat(keyCaptor.getValue()).isEqualTo("bakery:import:search-1");
        assertThat(jsonCaptor.getValue()).contains("\"keyword\":\"대전 빵집\"").contains("나무빵집");
        assertThat(ttlCaptor.getValue()).isEqualTo(Duration.ofMinutes(30));
    }

    @Test
    void getCandidatesOrThrow_returns_cache_whenPresent() throws Exception {
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder().externalId("place-1").name("나무빵집").build();
        String json =
                objectMapper.writeValueAsString(
                        BakeryImportCache.builder()
                                .keyword("대전 빵집")
                                .candidates(List.of(candidate))
                                .build());
        when(valueOps.get("bakery:import:search-1")).thenReturn(json);

        BakeryImportCache result = bakeryImportRedisService.getCandidatesOrThrow("search-1");

        assertThat(result.getKeyword()).isEqualTo("대전 빵집");
        assertThat(result.getCandidates()).extracting("name").containsExactly("나무빵집");
    }

    @Test
    void getCandidatesOrThrow_throws_whenMissing() {
        when(valueOps.get("bakery:import:missing")).thenReturn(null);

        assertThatThrownBy(() -> bakeryImportRedisService.getCandidatesOrThrow("missing"))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_IMPORT_RESULT_NOT_FOUND);
    }

    @Test
    void getPreview_wraps_cache_withSearchId() throws Exception {
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder().externalId("place-1").name("나무빵집").build();
        String json =
                objectMapper.writeValueAsString(
                        BakeryImportCache.builder()
                                .keyword("대전 빵집")
                                .candidates(List.of(candidate))
                                .build());
        when(valueOps.get("bakery:import:search-1")).thenReturn(json);

        BakeryImportPreviewResponse result = bakeryImportRedisService.getPreview("search-1");

        assertThat(result.getSearchId()).isEqualTo("search-1");
        assertThat(result.getKeyword()).isEqualTo("대전 빵집");
        assertThat(result.getCandidates()).extracting("name").containsExactly("나무빵집");
    }
}

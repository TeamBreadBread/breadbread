package com.breadbread.trend.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.trend.dto.TrendBakeryResponse;
import com.breadbread.trend.dto.TrendBreadResponse;
import com.breadbread.trend.dto.TrendDiscoverRequest;
import com.breadbread.trend.entity.BakeryTrendTag;
import com.breadbread.trend.entity.TrendStatus;
import com.breadbread.trend.repository.BakeryTrendTagRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TrendServiceTest {

    @InjectMocks private TrendService service;
    @Mock private BakeryTrendTagRepository repository;
    @Spy private ObjectMapper objectMapper = new ObjectMapper();

    // ── saveAll ───────────────────────────────────────────────────────────────

    @Test
    void saveAll_savesAllEntities() {
        List<TrendDiscoverRequest> requests =
                List.of(
                        request("소금빵", 1L, "파리바게뜨", List.of("소금빵"), List.of("NAVER_SEARCH")),
                        request("휘낭시에", 2L, "브리즈오브", List.of("휘낭시에"), List.of("NAVER_DATALAB")));

        service.saveAll(requests);

        ArgumentCaptor<List<BakeryTrendTag>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue().get(0).getKeyword()).isEqualTo("소금빵");
        assertThat(captor.getValue().get(1).getKeyword()).isEqualTo("휘낭시에");
    }

    @Test
    void saveAll_withNullListFields_savesEntities() {
        List<TrendDiscoverRequest> requests = List.of(request("소금빵", null, null, null, null));

        service.saveAll(requests);

        ArgumentCaptor<List<BakeryTrendTag>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getMatchedMenus()).isNull();
        assertThat(captor.getValue().get(0).getSources()).isNull();
    }

    @Test
    void saveAll_serializesListFieldsToJson() {
        List<TrendDiscoverRequest> requests =
                List.of(
                        request(
                                "소금빵",
                                1L,
                                "파리바게뜨",
                                List.of("소금빵", "버터소금빵"),
                                List.of("NAVER_SEARCH", "NAVER_DATALAB")));

        service.saveAll(requests);

        ArgumentCaptor<List<BakeryTrendTag>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        BakeryTrendTag entity = captor.getValue().get(0);
        assertThat(entity.getMatchedMenus()).isEqualTo("[\"소금빵\",\"버터소금빵\"]");
        assertThat(entity.getSources()).isEqualTo("[\"NAVER_SEARCH\",\"NAVER_DATALAB\"]");
    }

    @Test
    void saveAll_withEmptyList_savesEmptyEntities() {
        service.saveAll(List.of());

        verify(repository).saveAll(anyList());
    }

    // ── getBreads ─────────────────────────────────────────────────────────────

    @Test
    void getBreads_withoutStatus_returnsAllKeywords() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<BakeryTrendTag> page =
                new PageImpl<>(
                        List.of(tag("소금빵", TrendStatus.STABLE, 28.5, null, null)), pageable, 1);
        when(repository.findLatestByKeyword(any())).thenReturn(page);

        Page<TrendBreadResponse> result = service.getBreads(null, 0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getKeyword()).isEqualTo("소금빵");
        verify(repository).findLatestByKeyword(any());
    }

    @Test
    void getBreads_withValidStatus_returnsFilteredKeywords() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<BakeryTrendTag> page =
                new PageImpl<>(
                        List.of(tag("소금빵", TrendStatus.RISING, 50.0, null, null)), pageable, 1);
        when(repository.findLatestByKeywordAndStatus(eq(TrendStatus.RISING), any()))
                .thenReturn(page);

        Page<TrendBreadResponse> result = service.getBreads(TrendStatus.RISING, 0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTrendStatus()).isEqualTo("RISING");
        verify(repository).findLatestByKeywordAndStatus(eq(TrendStatus.RISING), any());
    }

    @Test
    void getBreads_parsesSourcesJsonToList() {
        PageRequest pageable = PageRequest.of(0, 20);
        BakeryTrendTag tag =
                tag("소금빵", TrendStatus.STABLE, 28.5, null, "[\"NAVER_SEARCH\",\"NAVER_DATALAB\"]");
        when(repository.findLatestByKeyword(any()))
                .thenReturn(new PageImpl<>(List.of(tag), pageable, 1));

        Page<TrendBreadResponse> result = service.getBreads(null, 0, 20);

        assertThat(result.getContent().get(0).getSources())
                .containsExactly("NAVER_SEARCH", "NAVER_DATALAB");
    }

    // ── getBakeries ───────────────────────────────────────────────────────────

    @Test
    void getBakeries_withoutKeyword_returnsAllBakeries() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<BakeryTrendTag> page =
                new PageImpl<>(List.of(bakeryTag("소금빵", 1L, "파리바게뜨", null, null)), pageable, 1);
        when(repository.findLatestByBakery(any())).thenReturn(page);

        Page<TrendBakeryResponse> result = service.getBakeries(null, 0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getBakeryId()).isEqualTo(1L);
        verify(repository).findLatestByBakery(any());
    }

    @Test
    void getBakeries_withKeyword_returnsFilteredBakeries() {
        PageRequest pageable = PageRequest.of(0, 20);
        Page<BakeryTrendTag> page =
                new PageImpl<>(List.of(bakeryTag("소금빵", 1L, "파리바게뜨", null, null)), pageable, 1);
        when(repository.findLatestByBakeryAndKeyword(eq("소금빵"), any())).thenReturn(page);

        Page<TrendBakeryResponse> result = service.getBakeries("소금빵", 0, 20);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getKeyword()).isEqualTo("소금빵");
        verify(repository).findLatestByBakeryAndKeyword(eq("소금빵"), any());
    }

    @Test
    void getBakeries_withBlankKeyword_returnsAllBakeries() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(repository.findLatestByBakery(any()))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        service.getBakeries("   ", 0, 20);

        verify(repository).findLatestByBakery(any());
    }

    @Test
    void getBakeries_parsesMatchedMenusJsonToList() {
        PageRequest pageable = PageRequest.of(0, 20);
        BakeryTrendTag tag = bakeryTag("소금빵", 1L, "파리바게뜨", "[\"소금빵\",\"버터소금빵\"]", null);
        when(repository.findLatestByBakery(any()))
                .thenReturn(new PageImpl<>(List.of(tag), pageable, 1));

        Page<TrendBakeryResponse> result = service.getBakeries(null, 0, 20);

        assertThat(result.getContent().get(0).getMatchedMenus()).containsExactly("소금빵", "버터소금빵");
    }

    // ── findAllForAdmin ───────────────────────────────────────────────────────

    @Test
    void findAllForAdmin_returnsPagedTags() {
        PageRequest pageable = PageRequest.of(0, 20);
        BakeryTrendTag t1 = tag("소금빵", TrendStatus.RISING, 50.0, null, null);
        BakeryTrendTag t2 = tag("휘낭시에", TrendStatus.STABLE, 30.0, null, null);
        when(repository.findAllByCreatedAtRange(
                        any(LocalDateTime.class), any(LocalDateTime.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(t1, t2), pageable, 2));

        var result = service.findAllForAdmin(null, null, pageable);

        assertThat(result.getTags()).hasSize(2);
        assertThat(result.getTotal()).isEqualTo(2);
        assertThat(result.getPage()).isEqualTo(0);
        assertThat(result.getSize()).isEqualTo(20);
        assertThat(result.isHasNext()).isFalse();
        assertThat(result.getTags().get(0).getKeyword()).isEqualTo("소금빵");
        assertThat(result.getTags().get(1).getKeyword()).isEqualTo("휘낭시에");
    }

    @Test
    void findAllForAdmin_returnsEmptyPage_whenNoData() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(repository.findAllByCreatedAtRange(
                        any(LocalDateTime.class), any(LocalDateTime.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(), pageable, 0));

        var result = service.findAllForAdmin(null, null, pageable);

        assertThat(result.getTags()).isEmpty();
        assertThat(result.getTotal()).isEqualTo(0);
        assertThat(result.isHasNext()).isFalse();
    }

    @Test
    void findAllForAdmin_hasNext_whenMorePagesExist() {
        PageRequest pageable = PageRequest.of(0, 1);
        BakeryTrendTag t = tag("소금빵", TrendStatus.RISING, 50.0, null, null);
        when(repository.findAllByCreatedAtRange(
                        any(LocalDateTime.class), any(LocalDateTime.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(t), pageable, 5));

        var result = service.findAllForAdmin(null, null, pageable);

        assertThat(result.isHasNext()).isTrue();
        assertThat(result.getTotal()).isEqualTo(5);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static TrendDiscoverRequest request(
            String keyword,
            Long bakeryId,
            String bakeryName,
            List<String> matchedMenus,
            List<String> source) {
        TrendDiscoverRequest req = new TrendDiscoverRequest();
        ReflectionTestUtils.setField(req, "keyword", keyword);
        ReflectionTestUtils.setField(req, "trendScore", 28.5);
        ReflectionTestUtils.setField(req, "trendStatus", "STABLE");
        ReflectionTestUtils.setField(req, "growthRate", 3.2);
        ReflectionTestUtils.setField(req, "bakeryId", bakeryId);
        ReflectionTestUtils.setField(req, "bakeryName", bakeryName);
        ReflectionTestUtils.setField(req, "matchedMenus", matchedMenus);
        ReflectionTestUtils.setField(req, "source", source);
        ReflectionTestUtils.setField(req, "collectedAt", OffsetDateTime.now());
        return req;
    }

    private static BakeryTrendTag tag(
            String keyword,
            TrendStatus status,
            double trendScore,
            String matchedMenus,
            String sources) {
        return BakeryTrendTag.builder()
                .keyword(keyword)
                .trendScore(trendScore)
                .trendStatus(status)
                .growthRate(3.2)
                .matchedMenus(matchedMenus)
                .sources(sources)
                .collectedAt(LocalDateTime.now())
                .build();
    }

    private static BakeryTrendTag bakeryTag(
            String keyword, Long bakeryId, String bakeryName, String matchedMenus, String sources) {
        return BakeryTrendTag.builder()
                .keyword(keyword)
                .trendScore(28.5)
                .trendStatus(TrendStatus.STABLE)
                .growthRate(3.2)
                .bakeryId(bakeryId)
                .bakeryName(bakeryName)
                .matchedMenus(matchedMenus)
                .sources(sources)
                .collectedAt(LocalDateTime.now())
                .build();
    }
}

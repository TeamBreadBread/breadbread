package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.client.KakaoLocalClient;
import com.breadbread.bakery.client.KakaoLocalClient.Place;
import com.breadbread.bakery.dto.imports.BakeryImportCache;
import com.breadbread.bakery.dto.imports.BakeryImportCandidate;
import com.breadbread.bakery.dto.response.BakeryImportPreviewResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class KakaoLocalImportServiceTest {

    @Mock private KakaoLocalClient kakaoLocalClient;
    @Mock private BakeryRepository bakeryRepository;
    @Mock private BakeryImportRedisService bakeryImportRedisService;

    @InjectMocks private KakaoLocalImportService kakaoLocalImportService;

    // ── helpers ───────────────────────────────────────────────────────────────

    private Place place(
            String id,
            String name,
            String roadAddress,
            String address,
            String x,
            String y,
            String categoryName) {
        Place p = new Place();
        ReflectionTestUtils.setField(p, "id", id);
        ReflectionTestUtils.setField(p, "placeName", name);
        ReflectionTestUtils.setField(p, "roadAddressName", roadAddress);
        ReflectionTestUtils.setField(p, "addressName", address);
        ReflectionTestUtils.setField(p, "x", x);
        ReflectionTestUtils.setField(p, "y", y);
        ReflectionTestUtils.setField(p, "phone", "042-000-0000");
        ReflectionTestUtils.setField(p, "categoryName", categoryName);
        return p;
    }

    private Place bakeryPlace(String name, String roadAddress, String address, String x, String y) {
        return place("kakao-1", name, roadAddress, address, x, y, "카페 > 베이커리");
    }

    private Bakery bakeryNamed(String name) {
        return Bakery.builder()
                .name(name)
                .address("대전광역시 유성구 대학로 1")
                .latitude(36.3)
                .longitude(127.3)
                .holidayClosed(false)
                .drinkAvailable(false)
                .dineInAvailable(false)
                .parkingAvailable(false)
                .build();
    }

    // ── searchByKeyword ───────────────────────────────────────────────────────

    @Test
    void searchByKeyword_returns_candidate_for_valid_place() {
        Place place = bakeryPlace("나무빵집", "대전광역시 유성구 대학로 99", "대전광역시 유성구 대학동 1", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries("대전 빵집")).thenReturn(List.of(place));
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).extracting("name").containsExactly("나무빵집");
        assertThat(result.getKeyword()).isEqualTo("대전 빵집");
        assertThat(result.getSearchId()).isNotBlank();
        verify(bakeryImportRedisService)
                .saveCandidates(any(), any(), argThat(list -> list.size() == 1));
        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void searchByKeyword_skips_non_bakery_category() {
        Place place =
                place(
                        "kakao-1",
                        "나무커피",
                        "대전광역시 유성구 대학로 99",
                        "대전광역시 유성구 대학동 1",
                        "127.35",
                        "36.36",
                        "카페 > 커피전문점");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_null_category() {
        Place place =
                place(
                        "kakao-1",
                        "나무빵집",
                        "대전광역시 유성구 대학로 99",
                        "대전광역시 유성구 대학동 1",
                        "127.35",
                        "36.36",
                        null);
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_accepts_jeogwa_category() {
        Place place =
                place(
                        "kakao-1",
                        "나무빵집",
                        "대전광역시 유성구 대학로 99",
                        "대전광역시 유성구 대학동 1",
                        "127.35",
                        "36.36",
                        "음식점 > 제과,베이커리");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).extracting("name").containsExactly("나무빵집");
    }

    @Test
    void searchByKeyword_skips_franchise() {
        Place place =
                bakeryPlace("파리바게뜨 유성점", "대전광역시 유성구 대학로 1", "대전광역시 유성구 대학동 1", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_existing_name_and_address() {
        Place place = bakeryPlace("나무빵집", "대전광역시 유성구 대학로 99", "대전광역시 유성구 대학동 1", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByNameAndAddress("나무빵집", "대전광역시 유성구 대학로 99")).thenReturn(true);

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_nearby_duplicate() {
        Place place = bakeryPlace("빵한모금", "대전광역시 유성구 대학로 99", "대전광역시 유성구 대학동 1", "127.35", "36.36");
        Bakery nearby = bakeryNamed("빵 한모금");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(nearby));

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_place_with_null_name() {
        Place place = bakeryPlace(null, "대전광역시 유성구 대학로 99", "대전광역시 유성구 대학동 1", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_place_with_invalid_coordinates() {
        Place place = bakeryPlace("나무빵집", "대전광역시 유성구 대학로 99", "대전광역시 유성구 대학동 1", "잘못된값", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_returns_valid_place_even_if_another_has_invalid_coordinates() {
        Place invalid = bakeryPlace("이상한빵집", "대전광역시 유성구 대학로 1", "대전광역시 유성구 대학동 1", "N/A", "N/A");
        Place valid = bakeryPlace("나무빵집", "대전광역시 유성구 대학로 99", "대전광역시 유성구 대학동 2", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(invalid, valid));
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).extracting("name").containsExactly("나무빵집");
    }

    @Test
    void searchByKeyword_uses_road_address_when_available() {
        Place place = bakeryPlace("나무빵집", "대전광역시 유성구 대학로 99", "대전광역시 유성구 대학동 1", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates().get(0).getAddress()).isEqualTo("대전광역시 유성구 대학로 99");
    }

    @Test
    void searchByKeyword_falls_back_to_address_name_when_no_road_address() {
        Place place = bakeryPlace("나무빵집", null, "대전광역시 유성구 대학동 1", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates().get(0).getAddress()).isEqualTo("대전광역시 유성구 대학동 1");
    }

    @Test
    void searchByKeyword_sets_region_from_address() {
        Place place = bakeryPlace("나무빵집", null, "대전광역시 유성구 대학동 1", "127.35", "36.36");
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates().get(0).getRegion()).isEqualTo("대전 유성구");
    }

    @Test
    void searchByKeyword_returns_empty_when_client_returns_empty() {
        when(kakaoLocalClient.searchBakeries(any())).thenReturn(List.of());

        BakeryImportPreviewResponse result = kakaoLocalImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    // ── confirmImport ─────────────────────────────────────────────────────────

    @Test
    void confirmImport_saves_selected_candidate() {
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder()
                        .externalId("kakao-1")
                        .name("나무빵집")
                        .address("대전광역시 유성구 대학로 99")
                        .region("대전 유성구")
                        .latitude(36.36)
                        .longitude(127.35)
                        .build();
        when(bakeryImportRedisService.getCandidatesOrThrow("search-1"))
                .thenReturn(
                        BakeryImportCache.builder()
                                .keyword("대전 빵집")
                                .candidates(List.of(candidate))
                                .build());
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);

        List<String> result = kakaoLocalImportService.confirmImport("search-1", List.of("kakao-1"));

        assertThat(result).containsExactly("나무빵집");
        ArgumentCaptor<Bakery> captor = ArgumentCaptor.forClass(Bakery.class);
        verify(bakeryRepository).save(captor.capture());
        assertThat(captor.getValue().getPlaceId()).isNull();
    }

    @Test
    void confirmImport_skips_already_existing() {
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder()
                        .externalId("kakao-1")
                        .name("나무빵집")
                        .address("대전광역시 유성구 대학로 99")
                        .build();
        when(bakeryImportRedisService.getCandidatesOrThrow("search-1"))
                .thenReturn(
                        BakeryImportCache.builder()
                                .keyword("대전 빵집")
                                .candidates(List.of(candidate))
                                .build());
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(true);

        List<String> result = kakaoLocalImportService.confirmImport("search-1", List.of("kakao-1"));

        assertThat(result).isEmpty();
        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void confirmImport_throws_when_candidateId_not_in_cache() {
        when(bakeryImportRedisService.getCandidatesOrThrow("search-1"))
                .thenReturn(
                        BakeryImportCache.builder().keyword("대전 빵집").candidates(List.of()).build());

        assertThatThrownBy(
                        () -> kakaoLocalImportService.confirmImport("search-1", List.of("missing")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_IMPORT_CANDIDATE_NOT_FOUND);
    }

    // ── extractRegion (private, via ReflectionTestUtils) ─────────────────────

    @Test
    void extractRegion_returns_city_and_gu() {
        String result =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                kakaoLocalImportService, "extractRegion", "대전광역시 유성구 대학동 99");
        assertThat(result).isEqualTo("대전 유성구");
    }

    @Test
    void extractRegion_returns_null_when_no_gu() {
        String result =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                kakaoLocalImportService, "extractRegion", "대전광역시 대학동 99");
        assertThat(result).isNull();
    }

    @Test
    void extractRegion_returns_null_for_null_input() {
        String result =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                kakaoLocalImportService, "extractRegion", (Object) null);
        assertThat(result).isNull();
    }

    @Test
    void extractRegion_strips_gwangyeoksi_suffix() {
        String result =
                (String)
                        ReflectionTestUtils.invokeMethod(
                                kakaoLocalImportService, "extractRegion", "부산광역시 해운대구 중동 1");
        assertThat(result).isEqualTo("부산 해운대구");
    }
}

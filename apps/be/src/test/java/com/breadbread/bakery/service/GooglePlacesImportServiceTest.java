package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyDouble;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.AddressComponent;
import com.breadbread.bakery.client.GooglePlacesClient.DisplayName;
import com.breadbread.bakery.client.GooglePlacesClient.Location;
import com.breadbread.bakery.client.GooglePlacesClient.OpeningPeriod;
import com.breadbread.bakery.client.GooglePlacesClient.PeriodDetail;
import com.breadbread.bakery.client.GooglePlacesClient.PlaceResult;
import com.breadbread.bakery.client.GooglePlacesClient.RegularOpeningHours;
import com.breadbread.bakery.dto.imports.BakeryImportCache;
import com.breadbread.bakery.dto.imports.BakeryImportCandidate;
import com.breadbread.bakery.dto.response.BakeryImportPreviewResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.time.LocalTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GooglePlacesImportServiceTest {

    @Mock private GooglePlacesClient googlePlacesClient;
    @Mock private BakeryRepository bakeryRepository;
    @Mock private BakeryImportRedisService bakeryImportRedisService;

    @InjectMocks private GooglePlacesImportService googlePlacesImportService;

    // ── helpers ───────────────────────────────────────────────────────────────

    private PlaceResult place(String id, String name, String address, double lat, double lng) {
        PlaceResult place = new PlaceResult();
        DisplayName displayName = new DisplayName();
        ReflectionTestUtils.setField(displayName, "text", name);
        Location location = new Location();
        ReflectionTestUtils.setField(location, "latitude", lat);
        ReflectionTestUtils.setField(location, "longitude", lng);

        ReflectionTestUtils.setField(place, "id", id);
        ReflectionTestUtils.setField(place, "displayName", name != null ? displayName : null);
        ReflectionTestUtils.setField(place, "formattedAddress", address);
        ReflectionTestUtils.setField(place, "location", location);
        ReflectionTestUtils.setField(place, "nationalPhoneNumber", "042-000-0000");
        ReflectionTestUtils.setField(place, "googleMapsUri", "https://maps.google.com/?cid=1");
        return place;
    }

    private void setAddressComponents(PlaceResult place, String gu, String dong, String city) {
        AddressComponent guComponent = new AddressComponent();
        ReflectionTestUtils.setField(guComponent, "longText", gu);
        ReflectionTestUtils.setField(guComponent, "types", List.of("sublocality_level_1"));

        AddressComponent dongComponent = new AddressComponent();
        ReflectionTestUtils.setField(dongComponent, "longText", dong);
        ReflectionTestUtils.setField(dongComponent, "types", List.of("sublocality_level_2"));

        AddressComponent cityComponent = new AddressComponent();
        ReflectionTestUtils.setField(cityComponent, "longText", city);
        ReflectionTestUtils.setField(cityComponent, "types", List.of("locality"));

        ReflectionTestUtils.setField(
                place, "addressComponents", List.of(guComponent, dongComponent, cityComponent));
    }

    private void setOpeningHours(PlaceResult place, int day, int openHour, int closeHour) {
        PeriodDetail open = new PeriodDetail();
        ReflectionTestUtils.setField(open, "day", day);
        ReflectionTestUtils.setField(open, "hour", openHour);
        ReflectionTestUtils.setField(open, "minute", 0);

        PeriodDetail close = new PeriodDetail();
        ReflectionTestUtils.setField(close, "day", day);
        ReflectionTestUtils.setField(close, "hour", closeHour);
        ReflectionTestUtils.setField(close, "minute", 0);

        OpeningPeriod period = new OpeningPeriod();
        ReflectionTestUtils.setField(period, "open", open);
        ReflectionTestUtils.setField(period, "close", close);

        RegularOpeningHours hours = new RegularOpeningHours();
        ReflectionTestUtils.setField(hours, "periods", List.of(period));

        ReflectionTestUtils.setField(place, "regularOpeningHours", hours);
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
        PlaceResult place = place("place-1", "나무빵집", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        when(googlePlacesClient.searchBakeriesByKeyword("대전 빵집")).thenReturn(List.of(place));
        when(bakeryRepository.existsByPlaceId(any())).thenReturn(false);
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).extracting("name").containsExactly("나무빵집");
        assertThat(result.getCandidates().get(0).getExternalId()).isEqualTo("place-1");
        assertThat(result.getKeyword()).isEqualTo("대전 빵집");
        assertThat(result.getSearchId()).isNotBlank();
        verify(bakeryImportRedisService)
                .saveCandidates(any(), any(), argThat(list -> list.size() == 1));
        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void searchByKeyword_skips_place_with_null_id() {
        PlaceResult place = place(null, "나무빵집", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
        verify(bakeryRepository, never()).existsByPlaceId(any());
    }

    @Test
    void searchByKeyword_skips_place_with_null_name() {
        PlaceResult place = place("place-1", null, "대전광역시 유성구 대학로 99", 36.36, 127.35);
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_place_with_null_address() {
        PlaceResult place = place("place-1", "나무빵집", null, 36.36, 127.35);
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_place_with_null_location() {
        PlaceResult place = place("place-1", "나무빵집", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        ReflectionTestUtils.setField(place, "location", null);
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_franchise() {
        PlaceResult place = place("place-1", "파리바게뜨 유성점", "대전광역시 유성구 대학로 1", 36.36, 127.35);
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_existing_placeId() {
        PlaceResult place = place("place-1", "나무빵집", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByPlaceId("place-1")).thenReturn(true);

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_existing_name_and_address() {
        PlaceResult place = place("place-1", "나무빵집", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByPlaceId(any())).thenReturn(false);
        when(bakeryRepository.existsByNameAndAddress("나무빵집", "대전광역시 유성구 대학로 99")).thenReturn(true);

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_skips_nearby_duplicate() {
        PlaceResult place = place("place-1", "빵한모금", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        Bakery nearby = bakeryNamed("빵 한모금");
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByPlaceId(any())).thenReturn(false);
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of(nearby));

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    @Test
    void searchByKeyword_sets_region_and_dong_from_address_components() {
        PlaceResult place = place("place-1", "나무빵집", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        setAddressComponents(place, "유성구", "대학동", "대전광역시");
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByPlaceId(any())).thenReturn(false);
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        BakeryImportCandidate candidate = result.getCandidates().get(0);
        assertThat(candidate.getRegion()).isEqualTo("대전 유성구");
        assertThat(candidate.getDong()).isEqualTo("대학동");
    }

    @Test
    void searchByKeyword_parses_weekday_business_hours() {
        PlaceResult place = place("place-1", "나무빵집", "대전광역시 유성구 대학로 99", 36.36, 127.35);
        setOpeningHours(place, 2, 9, 21); // 화요일
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of(place));
        when(bakeryRepository.existsByPlaceId(any())).thenReturn(false);
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);
        when(bakeryRepository.findAllNearby(anyDouble(), anyDouble(), anyDouble()))
                .thenReturn(List.of());

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        BakeryImportCandidate candidate = result.getCandidates().get(0);
        assertThat(candidate.getWeekdayOpen()).isEqualTo(LocalTime.of(9, 0));
        assertThat(candidate.getWeekdayClose()).isEqualTo(LocalTime.of(21, 0));
        assertThat(candidate.getClosedDays()).hasSize(6);
    }

    @Test
    void searchByKeyword_returns_empty_when_client_returns_empty() {
        when(googlePlacesClient.searchBakeriesByKeyword(any())).thenReturn(List.of());

        BakeryImportPreviewResponse result = googlePlacesImportService.searchByKeyword("대전 빵집");

        assertThat(result.getCandidates()).isEmpty();
    }

    // ── confirmImport ─────────────────────────────────────────────────────────

    @Test
    void confirmImport_saves_selected_candidate_with_placeId() {
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder()
                        .externalId("place-1")
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
        when(bakeryRepository.existsByPlaceId(any())).thenReturn(false);
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(false);

        List<String> result =
                googlePlacesImportService.confirmImport("search-1", List.of("place-1"));

        assertThat(result).containsExactly("나무빵집");
        ArgumentCaptor<Bakery> captor = ArgumentCaptor.forClass(Bakery.class);
        verify(bakeryRepository).save(captor.capture());
        assertThat(captor.getValue().getPlaceId()).isEqualTo("place-1");
    }

    @Test
    void confirmImport_skips_already_existing_placeId() {
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder()
                        .externalId("place-1")
                        .name("나무빵집")
                        .address("대전광역시 유성구 대학로 99")
                        .build();
        when(bakeryImportRedisService.getCandidatesOrThrow("search-1"))
                .thenReturn(
                        BakeryImportCache.builder()
                                .keyword("대전 빵집")
                                .candidates(List.of(candidate))
                                .build());
        when(bakeryRepository.existsByPlaceId("place-1")).thenReturn(true);

        List<String> result =
                googlePlacesImportService.confirmImport("search-1", List.of("place-1"));

        assertThat(result).isEmpty();
        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void confirmImport_skips_already_existing_name_and_address() {
        BakeryImportCandidate candidate =
                BakeryImportCandidate.builder()
                        .externalId("place-1")
                        .name("나무빵집")
                        .address("대전광역시 유성구 대학로 99")
                        .build();
        when(bakeryImportRedisService.getCandidatesOrThrow("search-1"))
                .thenReturn(
                        BakeryImportCache.builder()
                                .keyword("대전 빵집")
                                .candidates(List.of(candidate))
                                .build());
        when(bakeryRepository.existsByPlaceId(any())).thenReturn(false);
        when(bakeryRepository.existsByNameAndAddress(any(), any())).thenReturn(true);

        List<String> result =
                googlePlacesImportService.confirmImport("search-1", List.of("place-1"));

        assertThat(result).isEmpty();
        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void confirmImport_throws_when_candidateId_not_in_cache() {
        when(bakeryImportRedisService.getCandidatesOrThrow("search-1"))
                .thenReturn(
                        BakeryImportCache.builder().keyword("대전 빵집").candidates(List.of()).build());

        assertThatThrownBy(
                        () ->
                                googlePlacesImportService.confirmImport(
                                        "search-1", List.of("missing")))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_IMPORT_CANDIDATE_NOT_FOUND);
    }
}

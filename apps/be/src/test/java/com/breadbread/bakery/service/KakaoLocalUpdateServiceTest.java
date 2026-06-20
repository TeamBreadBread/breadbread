package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.client.KakaoLocalClient;
import com.breadbread.bakery.client.KakaoLocalClient.Place;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class KakaoLocalUpdateServiceTest {

    @Mock private KakaoLocalClient kakaoLocalClient;
    @Mock private BakeryRepository bakeryRepository;

    @InjectMocks private KakaoLocalUpdateService kakaoLocalUpdateService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(kakaoLocalUpdateService, "self", kakaoLocalUpdateService);
    }

    // ───────────────────────────── syncBakery ─────────────────────────────

    @Test
    void syncBakery_throws_whenBakeryNotFound() {
        when(bakeryRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> kakaoLocalUpdateService.syncBakery(1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void syncBakery_updatesFields_whenMatchedWithinDistance() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        Place p =
                place(
                        "영춘모찌",
                        "042-222-9400",
                        "127.3846",
                        "36.3505",
                        "대전광역시 중구 대흥동 123",
                        "대전광역시 중구 대흥로 10");
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenReturn(List.of(p));

        kakaoLocalUpdateService.syncBakery(1L);

        assertThat(bakery.getPhone()).isEqualTo("042-222-9400");
        assertThat(bakery.getDong()).isEqualTo("대흥동");
        assertThat(bakery.getRegion()).isEqualTo("대전 중구");
        assertThat(bakery.getAddress()).isEqualTo("대전광역시 중구 대흥로 10");
    }

    @Test
    void syncBakery_skips_whenNoMatch() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenReturn(List.of());

        kakaoLocalUpdateService.syncBakery(1L);

        assertThat(bakery.getPhone()).isNull();
    }

    @Test
    void syncBakery_skips_whenNameDiffers() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        Place p = place("다른빵집", "042-000-0000", "127.3846", "36.3505", "대전광역시 중구 대흥동 123", null);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenReturn(List.of(p));

        kakaoLocalUpdateService.syncBakery(1L);

        assertThat(bakery.getPhone()).isNull();
    }

    @Test
    void syncBakery_skips_whenDistanceExceeds200m() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        Place p = place("영춘모찌", "042-000-0000", "127.384", "36.368", "대전광역시 중구 은행동 1", null);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenReturn(List.of(p));

        kakaoLocalUpdateService.syncBakery(1L);

        assertThat(bakery.getPhone()).isNull();
    }

    @Test
    void syncBakery_usesAddressName_whenRoadAddressNameIsNull() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        Place p = place("영춘모찌", null, "127.3846", "36.3505", "대전광역시 중구 대흥동 123", null);
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenReturn(List.of(p));

        kakaoLocalUpdateService.syncBakery(1L);

        assertThat(bakery.getAddress()).isEqualTo("대전광역시 중구 대흥동 123");
    }

    @Test
    void syncBakery_usesRoadAddressName_forDongWhenAddressNameHasNoDong() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        Place p = place("영춘모찌", null, "127.3846", "36.3505", "대전광역시 중구", "대전광역시 중구 대흥동 123");
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(bakery));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenReturn(List.of(p));

        kakaoLocalUpdateService.syncBakery(1L);

        assertThat(bakery.getDong()).isEqualTo("대흥동");
    }

    // ───────────────────────────── syncAllBakeries ─────────────────────────────

    @Test
    void syncAllBakeries_returnsSuccessCount() {
        Bakery b1 = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        Bakery b2 = bakery(2L, "나폴레옹과자점", 36.351, 127.385);
        Place p =
                place(
                        "영춘모찌",
                        "042-111-1111",
                        "127.3846",
                        "36.3505",
                        "대전광역시 중구 대흥동 1",
                        "대전광역시 중구 대흥로 1");
        when(bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.APPROVED))
                .thenReturn(List.of(b1, b2));
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(b1));
        when(bakeryRepository.findById(2L)).thenReturn(Optional.of(b2));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenReturn(List.of(p));
        when(kakaoLocalClient.searchBakeries("나폴레옹과자점")).thenReturn(List.of());

        KakaoSyncResultResponse result = kakaoLocalUpdateService.syncAllBakeries();

        assertThat(result.getSuccessCount()).isEqualTo(1);
        assertThat(result.getSkippedCount()).isEqualTo(1);
        assertThat(result.getFailedCount()).isEqualTo(0);
        assertThat(result.getSkippedBakeries()).extracting("name").containsExactly("나폴레옹과자점");
        assertThat(result.getFailedBakeries()).isEmpty();
    }

    @Test
    void syncAllBakeries_countsFailedOnException() {
        Bakery b1 = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        when(bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.APPROVED))
                .thenReturn(List.of(b1));
        when(bakeryRepository.findById(1L)).thenReturn(Optional.of(b1));
        when(kakaoLocalClient.searchBakeries("영춘모찌")).thenThrow(new RuntimeException("API 오류"));

        KakaoSyncResultResponse result = kakaoLocalUpdateService.syncAllBakeries();

        assertThat(result.getSuccessCount()).isEqualTo(0);
        assertThat(result.getFailedCount()).isEqualTo(1);
        assertThat(result.getFailedBakeries()).extracting("id").containsExactly(1L);
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private Bakery bakery(Long id, String name, double lat, double lng) {
        Bakery bakery =
                Bakery.builder()
                        .name(name)
                        .address("주소")
                        .latitude(lat)
                        .longitude(lng)
                        .holidayClosed(false)
                        .drinkAvailable(false)
                        .dineInAvailable(false)
                        .parkingAvailable(false)
                        .build();
        ReflectionTestUtils.setField(bakery, "id", id);
        return bakery;
    }

    private Place place(
            String name,
            String phone,
            String x,
            String y,
            String addressName,
            String roadAddressName) {
        Place place = mock(Place.class);
        lenient().when(place.getPlaceName()).thenReturn(name);
        lenient().when(place.getPhone()).thenReturn(phone);
        lenient().when(place.getX()).thenReturn(x);
        lenient().when(place.getY()).thenReturn(y);
        lenient().when(place.getAddressName()).thenReturn(addressName);
        lenient().when(place.getRoadAddressName()).thenReturn(roadAddressName);
        return place;
    }
}

package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.PlacePhoto;
import com.breadbread.bakery.client.GooglePlacesClient.PlaceResult;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryImageRepository;
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
class GooglePlacesUpdateServiceTest {

    @Mock private BakeryRepository bakeryRepository;
    @Mock private BakeryImageRepository bakeryImageRepository;
    @Mock private GooglePlacesClient googlePlacesClient;
    @Mock private PlacesPhotoRedisService placesPhotoRedisService;

    @InjectMocks private GooglePlacesUpdateService googlePlacesUpdateService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(googlePlacesUpdateService, "self", googlePlacesUpdateService);
    }

    // ───────────────────────────── syncBakery ─────────────────────────────

    @Test
    void syncBakery_throws_whenBakeryNotFound() {
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> googlePlacesUpdateService.syncBakery(1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void syncBakery_skips_whenNoSearchResult() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(bakery));
        when(googlePlacesClient.searchBakeryPlace("영춘모찌", 36.3504, 127.3845)).thenReturn(List.of());

        boolean result = googlePlacesUpdateService.syncBakery(1L);

        assertThat(result).isFalse();
    }

    @Test
    void syncBakery_skips_whenDistanceExceeds300m() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        PlaceResult place = placeResult("place-1", 36.368, 127.384, List.of());
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(bakery));
        when(googlePlacesClient.searchBakeryPlace("영춘모찌", 36.3504, 127.3845))
                .thenReturn(List.of(place));

        boolean result = googlePlacesUpdateService.syncBakery(1L);

        assertThat(result).isFalse();
    }

    @Test
    void syncBakery_updatesPlaceId_whenPlaceIdIsNull() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        PlaceResult place = placeResult("place-1", 36.3505, 127.3846, List.of());
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(bakery));
        when(googlePlacesClient.searchBakeryPlace("영춘모찌", 36.3504, 127.3845))
                .thenReturn(List.of(place));

        boolean result = googlePlacesUpdateService.syncBakery(1L);

        assertThat(result).isTrue();
        assertThat(bakery.getPlaceId()).isEqualTo("place-1");
    }

    @Test
    void syncBakery_savesImages_whenPhotosExistAndNoGcsImages() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        PlacePhoto photo1 = placePhoto("photo-name-1");
        PlacePhoto photo2 = placePhoto("photo-name-2");
        PlaceResult place = placeResult("place-1", 36.3505, 127.3846, List.of(photo1, photo2));
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(bakery));
        when(googlePlacesClient.searchBakeryPlace("영춘모찌", 36.3504, 127.3845))
                .thenReturn(List.of(place));

        googlePlacesUpdateService.syncBakery(1L);

        verify(bakeryImageRepository).deleteAllByBakery(bakery);
        verify(bakeryImageRepository).saveAll(any());
        verify(placesPhotoRedisService).warmPhotoCache("place-1", 0, "photo-name-1");
        verify(placesPhotoRedisService).warmPhotoCache("place-1", 1, "photo-name-2");
    }

    @Test
    void syncBakery_skipsImageSave_whenGcsImagesExist() {
        Bakery bakery = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        com.breadbread.bakery.entity.BakeryImage gcsImage =
                mock(com.breadbread.bakery.entity.BakeryImage.class);
        lenient().when(gcsImage.getImageUrl()).thenReturn("https://storage.googleapis.com/img.jpg");
        ReflectionTestUtils.setField(bakery, "images", List.of(gcsImage));

        PlacePhoto photo = placePhoto("photo-name-1");
        PlaceResult place = placeResult("place-1", 36.3505, 127.3846, List.of(photo));
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(bakery));
        when(googlePlacesClient.searchBakeryPlace("영춘모찌", 36.3504, 127.3845))
                .thenReturn(List.of(place));

        googlePlacesUpdateService.syncBakery(1L);

        verify(bakeryImageRepository, never()).saveAll(any());
    }

    // ───────────────────────────── syncAllBakeries ─────────────────────────────

    @Test
    void syncAllBakeries_returnsSuccessAndSkipped() {
        Bakery b1 = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        Bakery b2 = bakery(2L, "나폴레옹과자점", 36.351, 127.385);
        PlaceResult place = placeResult("place-1", 36.3505, 127.3846, List.of());
        when(bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.APPROVED))
                .thenReturn(List.of(b1, b2));
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(b1));
        when(bakeryRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(b2));
        when(googlePlacesClient.searchBakeryPlace(eq("영춘모찌"), eq(36.3504), eq(127.3845)))
                .thenReturn(List.of(place));
        when(googlePlacesClient.searchBakeryPlace(eq("나폴레옹과자점"), eq(36.351), eq(127.385)))
                .thenReturn(List.of());

        KakaoSyncResultResponse result = googlePlacesUpdateService.syncAllBakeries();

        assertThat(result.getSuccessCount()).isEqualTo(1);
        assertThat(result.getSkippedCount()).isEqualTo(1);
        assertThat(result.getFailedCount()).isEqualTo(0);
        assertThat(result.getSkippedBakeries()).extracting("name").containsExactly("나폴레옹과자점");
    }

    @Test
    void syncAllBakeries_countsFailedOnException() {
        Bakery b1 = bakery(1L, "영춘모찌", 36.3504, 127.3845);
        when(bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.APPROVED))
                .thenReturn(List.of(b1));
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(b1));
        when(googlePlacesClient.searchBakeryPlace("영춘모찌", 36.3504, 127.3845))
                .thenThrow(new RuntimeException("API 오류"));

        KakaoSyncResultResponse result = googlePlacesUpdateService.syncAllBakeries();

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

    private PlaceResult placeResult(String id, double lat, double lng, List<PlacePhoto> photos) {
        GooglePlacesClient.Location location = mock(GooglePlacesClient.Location.class);
        lenient().when(location.getLatitude()).thenReturn(lat);
        lenient().when(location.getLongitude()).thenReturn(lng);

        PlaceResult place = mock(PlaceResult.class);
        lenient().when(place.getId()).thenReturn(id);
        lenient().when(place.getLocation()).thenReturn(location);
        lenient().when(place.getPhotos()).thenReturn(photos.isEmpty() ? null : photos);
        return place;
    }

    private PlacePhoto placePhoto(String name) {
        PlacePhoto photo = mock(PlacePhoto.class);
        lenient().when(photo.getName()).thenReturn(name);
        return photo;
    }
}

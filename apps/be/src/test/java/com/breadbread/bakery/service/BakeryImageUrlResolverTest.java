package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.BakeryImage;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BakeryImageUrlResolverTest {

    @Mock private PlacesPhotoRedisService placesPhotoRedisService;
    @InjectMocks private BakeryImageUrlResolver resolver;

    // ───────────────────────────── GCS 이미지 ─────────────────────────────

    @Test
    void resolve_returnsImageUrl_whenGcsImagePresent() {
        BakeryImage image =
                BakeryImage.builder()
                        .imageUrl("https://storage.googleapis.com/bucket/img.jpg")
                        .displayOrder(1)
                        .build();

        String result = resolver.resolve(image);

        assertThat(result).isEqualTo("https://storage.googleapis.com/bucket/img.jpg");
        verifyNoInteractions(placesPhotoRedisService);
    }

    @Test
    void resolve_prefersGcsUrl_whenBothGcsAndPlaceIdPresent() {
        BakeryImage image =
                BakeryImage.builder()
                        .imageUrl("https://storage.googleapis.com/bucket/img.jpg")
                        .placeId("ChIJ123")
                        .displayOrder(1)
                        .build();

        String result = resolver.resolve(image);

        assertThat(result).isEqualTo("https://storage.googleapis.com/bucket/img.jpg");
        verifyNoInteractions(placesPhotoRedisService);
    }

    // ───────────────────────────── Places 이미지 ─────────────────────────────

    @Test
    void resolve_callsPlacesService_whenPlacesImage() {
        BakeryImage image = BakeryImage.builder().placeId("ChIJ123").displayOrder(1).build();
        when(placesPhotoRedisService.getOrFetchPhotoUrl("ChIJ123", 0))
                .thenReturn("https://places.googleapis.com/photo/abc");

        String result = resolver.resolve(image);

        assertThat(result).isEqualTo("https://places.googleapis.com/photo/abc");
        verify(placesPhotoRedisService).getOrFetchPhotoUrl("ChIJ123", 0);
    }

    @Test
    void resolve_usesCorrectPhotoIndex_basedOnDisplayOrder() {
        BakeryImage image = BakeryImage.builder().placeId("ChIJ123").displayOrder(3).build();
        when(placesPhotoRedisService.getOrFetchPhotoUrl("ChIJ123", 2))
                .thenReturn("https://places.googleapis.com/photo/abc");

        resolver.resolve(image);

        verify(placesPhotoRedisService).getOrFetchPhotoUrl("ChIJ123", 2);
    }

    @Test
    void resolve_usesZeroIndex_whenDisplayOrderIsZero() {
        BakeryImage image = BakeryImage.builder().placeId("ChIJ123").displayOrder(0).build();
        when(placesPhotoRedisService.getOrFetchPhotoUrl("ChIJ123", 0)).thenReturn(null);

        resolver.resolve(image);

        verify(placesPhotoRedisService).getOrFetchPhotoUrl("ChIJ123", 0);
    }

    @Test
    void resolve_returnsNull_whenPlacesServiceReturnsNull() {
        BakeryImage image = BakeryImage.builder().placeId("ChIJ123").displayOrder(1).build();
        when(placesPhotoRedisService.getOrFetchPhotoUrl("ChIJ123", 0)).thenReturn(null);

        String result = resolver.resolve(image);

        assertThat(result).isNull();
    }

    // ───────────────────────────── 이미지 없음 ─────────────────────────────

    @Test
    void resolve_returnsNull_whenNoImageUrlAndNoPlaceId() {
        BakeryImage image = BakeryImage.builder().displayOrder(1).build();

        String result = resolver.resolve(image);

        assertThat(result).isNull();
        verifyNoInteractions(placesPhotoRedisService);
    }
}

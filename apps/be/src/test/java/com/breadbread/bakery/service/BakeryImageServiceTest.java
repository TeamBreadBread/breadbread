package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.service.BakeryImageService.PreviewBatch;
import com.breadbread.global.service.GcsService;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BakeryImageServiceTest {

    @Mock private BakeryImageRepository bakeryImageRepository;
    @Mock private BakeryImageUrlResolver bakeryImageUrlResolver;
    @Mock private GcsService gcsService;

    @InjectMocks private BakeryImageService bakeryImageService;

    // ── saveImages ───────────────────────────────────────────────────────────

    @Test
    void saveImages_does_nothing_when_urls_null() {
        Bakery bakery = bakeryWithId(1L);

        bakeryImageService.saveImages(bakery, null);

        verify(bakeryImageRepository, never()).saveAll(any());
    }

    @Test
    void saveImages_persists_images_with_correct_display_order() {
        Bakery bakery = bakeryWithId(1L);
        String[] urls = {"a.jpg", "b.jpg", "c.jpg"};

        bakeryImageService.saveImages(bakery, urls);

        ArgumentCaptor<List<BakeryImage>> captor = ArgumentCaptor.forClass(List.class);
        verify(bakeryImageRepository).saveAll(captor.capture());
        List<BakeryImage> saved = captor.getValue();
        assertThat(saved).hasSize(3);
        assertThat(saved.get(0).getImageUrl()).isEqualTo("a.jpg");
        assertThat(saved.get(0).getDisplayOrder()).isEqualTo(1);
        assertThat(saved.get(1).getImageUrl()).isEqualTo("b.jpg");
        assertThat(saved.get(1).getDisplayOrder()).isEqualTo(2);
        assertThat(saved.get(2).getImageUrl()).isEqualTo("c.jpg");
        assertThat(saved.get(2).getDisplayOrder()).isEqualTo(3);
    }

    // ── deleteAllImages ──────────────────────────────────────────────────────

    @Test
    void deleteAllImages_deletes_gcs_and_db() {
        Bakery bakery = bakeryWithId(2L);
        bakery.getImages()
                .add(
                        BakeryImage.builder()
                                .imageUrl("x.jpg")
                                .displayOrder(1)
                                .bakery(bakery)
                                .build());
        bakery.getImages()
                .add(
                        BakeryImage.builder()
                                .imageUrl("y.jpg")
                                .displayOrder(2)
                                .bakery(bakery)
                                .build());

        bakeryImageService.deleteAllImages(bakery);

        verify(gcsService).deleteQuietly("x.jpg");
        verify(gcsService).deleteQuietly("y.jpg");
        verify(bakeryImageRepository).deleteAllByBakery(bakery);
    }

    @Test
    void deleteAllImages_skips_gcs_when_url_is_null() {
        Bakery bakery = bakeryWithId(3L);
        bakery.getImages()
                .add(BakeryImage.builder().imageUrl(null).displayOrder(1).bakery(bakery).build());

        bakeryImageService.deleteAllImages(bakery);

        verify(gcsService, never()).deleteQuietly(any());
        verify(bakeryImageRepository).deleteAllByBakery(bakery);
    }

    // ── replaceImages ────────────────────────────────────────────────────────

    @Test
    void replaceImages_deletes_old_then_saves_new() {
        Bakery bakery = bakeryWithId(4L);
        bakery.getImages()
                .add(
                        BakeryImage.builder()
                                .imageUrl("old.jpg")
                                .displayOrder(1)
                                .bakery(bakery)
                                .build());
        String[] newUrls = {"new1.jpg", "new2.jpg"};

        bakeryImageService.replaceImages(bakery, newUrls);

        verify(gcsService).deleteQuietly("old.jpg");
        verify(bakeryImageRepository).deleteAllByBakery(bakery);
        ArgumentCaptor<List<BakeryImage>> captor = ArgumentCaptor.forClass(List.class);
        verify(bakeryImageRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
        assertThat(captor.getValue().get(0).getImageUrl()).isEqualTo("new1.jpg");
    }

    @Test
    void replaceImages_does_not_delete_gcs_when_url_is_reused() {
        Bakery bakery = bakeryWithId(5L);
        bakery.getImages()
                .add(
                        BakeryImage.builder()
                                .imageUrl("keep.jpg")
                                .displayOrder(1)
                                .bakery(bakery)
                                .build());
        // 기존 URL을 새 목록에 그대로 포함 → GCS 삭제 불필요
        String[] newUrls = {"keep.jpg", "added.jpg"};

        bakeryImageService.replaceImages(bakery, newUrls);

        verify(gcsService, never()).deleteQuietly("keep.jpg");
        verify(bakeryImageRepository).deleteAllByBakery(bakery);
        ArgumentCaptor<List<BakeryImage>> captor = ArgumentCaptor.forClass(List.class);
        verify(bakeryImageRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(2);
    }

    // ── resolvePreviewBatch ──────────────────────────────────────────────────

    @Test
    void resolvePreviewBatch_returns_empty_when_ids_empty() {
        PreviewBatch result = bakeryImageService.resolvePreviewBatch(List.of());

        assertThat(result.previewUrls()).isEmpty();
        assertThat(result.remainingCounts()).isEmpty();
        verify(bakeryImageRepository, never()).findAllByBakeryIdInOrderByDisplayOrderAsc(any());
    }

    @Test
    void resolvePreviewBatch_returns_first_four_and_remaining_count() {
        Bakery bakery = bakeryWithId(10L);
        List<BakeryImage> images = new ArrayList<>();
        for (int i = 1; i <= 6; i++) {
            images.add(
                    BakeryImage.builder()
                            .imageUrl("u" + i + ".jpg")
                            .displayOrder(i)
                            .bakery(bakery)
                            .build());
        }
        // limit(4) 적용 후 실제 resolve 호출 대상은 첫 4개뿐
        for (int i = 0; i < 4; i++) {
            when(bakeryImageUrlResolver.resolve(images.get(i))).thenReturn("u" + (i + 1) + ".jpg");
        }
        when(bakeryImageRepository.findAllByBakeryIdInOrderByDisplayOrderAsc(List.of(10L)))
                .thenReturn(images);

        PreviewBatch result = bakeryImageService.resolvePreviewBatch(List.of(10L));

        assertThat(result.previewUrls().get(10L))
                .containsExactly("u1.jpg", "u2.jpg", "u3.jpg", "u4.jpg");
        assertThat(result.remainingCounts().get(10L)).isEqualTo(2);
    }

    @Test
    void resolvePreviewBatch_remaining_zero_when_four_or_fewer_images() {
        Bakery bakery = bakeryWithId(11L);
        List<BakeryImage> images = new ArrayList<>();
        for (int i = 1; i <= 3; i++) {
            BakeryImage img =
                    BakeryImage.builder()
                            .imageUrl("img" + i + ".jpg")
                            .displayOrder(i)
                            .bakery(bakery)
                            .build();
            images.add(img);
            when(bakeryImageUrlResolver.resolve(img)).thenReturn("img" + i + ".jpg");
        }
        when(bakeryImageRepository.findAllByBakeryIdInOrderByDisplayOrderAsc(List.of(11L)))
                .thenReturn(images);

        PreviewBatch result = bakeryImageService.resolvePreviewBatch(List.of(11L));

        assertThat(result.previewUrls().get(11L)).hasSize(3);
        assertThat(result.remainingCounts().get(11L)).isZero();
    }

    // ── resolveThumbnails ────────────────────────────────────────────────────

    @Test
    void resolveThumbnails_returns_empty_when_ids_empty() {
        var result = bakeryImageService.resolveThumbnails(List.of());

        assertThat(result).isEmpty();
        verify(bakeryImageRepository, never()).findAllByBakeryIdInAndDisplayOrder(any(), anyInt());
    }

    @Test
    void resolveThumbnails_returns_first_image_per_bakery() {
        Bakery bakery = bakeryWithId(20L);
        BakeryImage first =
                BakeryImage.builder().imageUrl("thumb.jpg").displayOrder(1).bakery(bakery).build();
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(20L), 1))
                .thenReturn(List.of(first));
        when(bakeryImageUrlResolver.resolve(first)).thenReturn("thumb.jpg");

        var result = bakeryImageService.resolveThumbnails(List.of(20L));

        assertThat(result.get(20L)).isEqualTo("thumb.jpg");
    }

    // ── resolveDetailUrls ────────────────────────────────────────────────────

    @Test
    void resolveDetailUrls_returns_empty_when_images_empty() {
        var result = bakeryImageService.resolveDetailUrls(List.of());

        assertThat(result).isEmpty();
    }

    @Test
    void resolveDetailUrls_sorts_by_display_order_and_resolves_urls() {
        Bakery bakery = bakeryWithId(30L);
        BakeryImage img2 =
                BakeryImage.builder().imageUrl("b.jpg").displayOrder(2).bakery(bakery).build();
        BakeryImage img1 =
                BakeryImage.builder().imageUrl("a.jpg").displayOrder(1).bakery(bakery).build();
        when(bakeryImageUrlResolver.resolve(img1)).thenReturn("a.jpg");
        when(bakeryImageUrlResolver.resolve(img2)).thenReturn("b.jpg");

        var result = bakeryImageService.resolveDetailUrls(List.of(img2, img1));

        assertThat(result).containsExactly("a.jpg", "b.jpg");
    }

    @Test
    void resolveDetailUrls_filters_null_urls() {
        Bakery bakery = bakeryWithId(31L);
        BakeryImage img1 =
                BakeryImage.builder().imageUrl("ok.jpg").displayOrder(1).bakery(bakery).build();
        BakeryImage img2 =
                BakeryImage.builder().imageUrl("broken.jpg").displayOrder(2).bakery(bakery).build();
        when(bakeryImageUrlResolver.resolve(img1)).thenReturn("ok.jpg");
        when(bakeryImageUrlResolver.resolve(img2)).thenReturn(null);

        var result = bakeryImageService.resolveDetailUrls(List.of(img1, img2));

        assertThat(result).containsExactly("ok.jpg");
    }

    private static Bakery bakeryWithId(long id) {
        Bakery b =
                Bakery.builder()
                        .name("테스트빵집")
                        .address("주소")
                        .region("대전")
                        .latitude(36.0)
                        .longitude(127.0)
                        .phone("010")
                        .rating(null)
                        .mapLink("m")
                        .dineInAvailable(true)
                        .parkingAvailable(false)
                        .drinkAvailable(true)
                        .note("")
                        .build();
        ReflectionTestUtils.setField(b, "id", id);
        return b;
    }
}

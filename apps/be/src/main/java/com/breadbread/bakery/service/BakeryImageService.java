package com.breadbread.bakery.service;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.global.service.GcsService;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BakeryImageService {

    private final BakeryImageRepository bakeryImageRepository;
    private final BakeryImageUrlResolver bakeryImageUrlResolver;
    private final GcsService gcsService;

    /** createBakery — 새 이미지 저장 */
    @Transactional
    public void saveImages(Bakery bakery, String[] urls) {
        if (urls == null) return;
        List<BakeryImage> images = new ArrayList<>();
        for (int i = 0; i < urls.length; i++) {
            images.add(
                    BakeryImage.builder()
                            .imageUrl(urls[i])
                            .displayOrder(i + 1)
                            .bakery(bakery)
                            .build());
        }
        bakeryImageRepository.saveAll(images);
    }

    /** updateBakery — GCS 삭제 후 새 이미지로 교체 */
    @Transactional
    public void replaceImages(Bakery bakery, String[] urls) {
        Set<String> nextUrls =
                urls == null
                        ? Collections.emptySet()
                        : Arrays.stream(urls).filter(Objects::nonNull).collect(Collectors.toSet());
        bakery.getImages().stream()
                .map(BakeryImage::getImageUrl)
                .filter(Objects::nonNull)
                .filter(url -> !nextUrls.contains(url))
                .forEach(gcsService::deleteQuietly);
        bakeryImageRepository.deleteAllByBakery(bakery);
        saveImages(bakery, urls);
    }

    /** deleteBakery — GCS + DB 이미지 전체 삭제 */
    @Transactional
    public void deleteAllImages(Bakery bakery) {
        bakery.getImages()
                .forEach(
                        img -> {
                            if (img.getImageUrl() != null) {
                                gcsService.deleteQuietly(img.getImageUrl());
                            }
                        });
        bakeryImageRepository.deleteAllByBakery(bakery);
    }

    /** search — 빵집별 이미지 프리뷰 URL(최대 4장) + 나머지 개수 배치 조회 */
    @Transactional(readOnly = true)
    public PreviewBatch resolvePreviewBatch(List<Long> bakeryIds) {
        if (bakeryIds.isEmpty()) return PreviewBatch.empty();

        Map<Long, List<BakeryImage>> grouped =
                bakeryImageRepository.findAllByBakeryIdInOrderByDisplayOrderAsc(bakeryIds).stream()
                        .collect(Collectors.groupingBy(img -> img.getBakery().getId()));

        Map<Long, List<String>> previewUrls = new HashMap<>();
        Map<Long, Integer> remainingCounts = new HashMap<>();
        for (Long id : bakeryIds) {
            List<BakeryImage> ordered = grouped.getOrDefault(id, List.of());
            remainingCounts.put(id, ordered.size() > 4 ? ordered.size() - 4 : 0);
            previewUrls.put(
                    id,
                    ordered.stream()
                            .limit(4)
                            .map(bakeryImageUrlResolver::resolve)
                            .filter(Objects::nonNull)
                            .toList());
        }
        return new PreviewBatch(previewUrls, remainingCounts);
    }

    /** searchSimple — 빵집별 썸네일(첫 번째 이미지) URL 배치 조회 */
    @Transactional(readOnly = true)
    public Map<Long, String> resolveThumbnails(List<Long> bakeryIds) {
        if (bakeryIds.isEmpty()) return Collections.emptyMap();

        Map<Long, String> result = new HashMap<>();
        bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(bakeryIds, 1)
                .forEach(
                        img -> {
                            String url = bakeryImageUrlResolver.resolve(img);
                            if (url != null) result.put(img.getBakery().getId(), url);
                        });
        return result;
    }

    /** findOne — 이미지 URL 목록 (displayOrder 정렬) */
    public List<String> resolveDetailUrls(List<BakeryImage> images) {
        return images.stream()
                .sorted(Comparator.comparingInt(BakeryImage::getDisplayOrder))
                .map(bakeryImageUrlResolver::resolve)
                .filter(Objects::nonNull)
                .toList();
    }

    public record PreviewBatch(
            Map<Long, List<String>> previewUrls, Map<Long, Integer> remainingCounts) {

        static PreviewBatch empty() {
            return new PreviewBatch(Collections.emptyMap(), Collections.emptyMap());
        }
    }
}

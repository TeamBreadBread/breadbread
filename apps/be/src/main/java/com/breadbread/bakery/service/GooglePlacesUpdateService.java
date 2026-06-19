package com.breadbread.bakery.service;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.PlaceResult;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse.BakeryEntry;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GooglePlacesUpdateService {

    private final BakeryRepository bakeryRepository;
    private final BakeryImageRepository bakeryImageRepository;
    private final GooglePlacesClient googlePlacesClient;
    private final PlacesPhotoRedisService placesPhotoRedisService;

    // syncAllBakeries에서 REQUIRES_NEW가 올바르게 적용되려면 self-invocation이 아닌 프록시 경유 필요
    @Lazy @Autowired private GooglePlacesUpdateService self;

    /**
     * @return true = 실제 동기화 완료, false = Places 검색 결과 없어 스킵
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean syncBakery(Long bakeryId) {
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrue(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        List<PlaceResult> candidates =
                googlePlacesClient.searchBakeryPlace(
                        bakery.getName(), bakery.getLatitude(), bakery.getLongitude());

        PlaceResult place =
                candidates.stream()
                        .filter(p -> p.getLocation() != null)
                        .min(
                                Comparator.comparingDouble(
                                        p ->
                                                distanceMeters(
                                                        bakery.getLatitude(),
                                                        bakery.getLongitude(),
                                                        p.getLocation().getLatitude(),
                                                        p.getLocation().getLongitude())))
                        .orElse(null);

        if (place == null) {
            log.warn("[Places 동기화] 장소 검색 결과 없음: bakeryId={}, name={}", bakeryId, bakery.getName());
            return false;
        }

        double distance =
                distanceMeters(
                        bakery.getLatitude(),
                        bakery.getLongitude(),
                        place.getLocation().getLatitude(),
                        place.getLocation().getLongitude());

        if (distance > 300) {
            log.warn(
                    "[Places 동기화] 가장 가까운 후보도 300m 초과, 스킵: bakeryId={}, name={}, distance={}m",
                    bakeryId,
                    bakery.getName(),
                    (int) distance);
            return false;
        }

        if (bakery.getPlaceId() == null) {
            bakery.updatePlaceId(place.getId());
        }

        int photoCount =
                place.getPhotos() != null
                        ? Math.min(place.getPhotos().size(), GooglePlacesClient.MAX_PHOTOS)
                        : 0;

        boolean hasGcsImages =
                bakery.getImages() != null
                        && bakery.getImages().stream().anyMatch(img -> img.getImageUrl() != null);

        if (photoCount > 0 && !hasGcsImages) {
            bakeryImageRepository.deleteAllByBakery(bakery);

            List<BakeryImage> newImages = new ArrayList<>();
            for (int i = 0; i < photoCount; i++) {
                newImages.add(BakeryImage.builder().displayOrder(i + 1).bakery(bakery).build());
            }
            bakeryImageRepository.saveAll(newImages);

            // Text Search 응답의 photoName으로 바로 캐시 워밍 (Place Details 콜 생략)
            List<GooglePlacesClient.PlacePhoto> photos = place.getPhotos();
            for (int i = 0; i < photoCount; i++) {
                placesPhotoRedisService.warmPhotoCache(place.getId(), i, photos.get(i).getName());
            }
        }

        return true;
    }

    public KakaoSyncResultResponse syncAllBakeries() {
        List<Bakery> bakeries =
                bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.APPROVED);
        log.debug("[Places 동기화] 전체 동기화 시작: count={}", bakeries.size());
        int success = 0;
        List<BakeryEntry> skipped = new ArrayList<>();
        List<BakeryEntry> failed = new ArrayList<>();
        for (Bakery bakery : bakeries) {
            try {
                if (self.syncBakery(bakery.getId())) success++;
                else
                    skipped.add(
                            BakeryEntry.builder()
                                    .id(bakery.getId())
                                    .name(bakery.getName())
                                    .build());
            } catch (Exception e) {
                log.error(
                        "[Places 동기화] 실패: bakeryId={}, name={}",
                        bakery.getId(),
                        bakery.getName(),
                        e);
                failed.add(BakeryEntry.builder().id(bakery.getId()).name(bakery.getName()).build());
            }
        }
        log.info(
                "[Places 동기화] 전체 동기화 완료: success={}, skipped={}, failed={}",
                success,
                skipped.size(),
                failed.size());
        return KakaoSyncResultResponse.builder()
                .successCount(success)
                .skippedCount(skipped.size())
                .failedCount(failed.size())
                .skippedBakeries(skipped)
                .failedBakeries(failed)
                .build();
    }

    @Scheduled(cron = "0 0 4 */4 * *", zone = "Asia/Seoul")
    public void warmAllPhotoCaches() {
        List<Bakery> bakeries =
                bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.APPROVED);
        if (bakeries.isEmpty()) return;

        Map<Long, String> placeIdByBakeryId =
                bakeries.stream()
                        .filter(b -> b.getPlaceId() != null)
                        .collect(Collectors.toMap(Bakery::getId, Bakery::getPlaceId));
        List<Long> bakeryIds = bakeries.stream().map(Bakery::getId).toList();

        log.debug("[Places 캐시 워밍] 시작: count={}", bakeryIds.size());
        int success = 0, skip = 0, fail = 0;

        List<BakeryImage> allImages =
                bakeryImageRepository.findAllByBakeryIdInOrderByDisplayOrderAsc(bakeryIds);
        Map<Long, List<BakeryImage>> imagesByBakery =
                allImages.stream().collect(Collectors.groupingBy(img -> img.getBakery().getId()));

        for (Long bakeryId : bakeryIds) {
            List<BakeryImage> images = imagesByBakery.getOrDefault(bakeryId, List.of());
            if (images.isEmpty()) {
                try {
                    if (self.syncBakery(bakeryId)) success++;
                    else skip++;
                } catch (Exception e) {
                    log.error("[Places 캐시 워밍] sync 실패: bakeryId={}", bakeryId, e);
                    fail++;
                }
                continue;
            }
            boolean hasGcsImages = images.stream().anyMatch(img -> img.getImageUrl() != null);
            if (hasGcsImages) {
                skip++;
                continue;
            }
            String placeId = placeIdByBakeryId.get(bakeryId);
            if (placeId == null) {
                skip++;
                continue;
            }
            try {
                List<GooglePlacesClient.PlacePhoto> photos =
                        googlePlacesClient
                                .getPlaceDetails(placeId)
                                .map(PlaceResult::getPhotos)
                                .orElse(null);
                if (photos == null) {
                    fail++;
                    continue;
                }
                int count = Math.min(photos.size(), GooglePlacesClient.MAX_PHOTOS);
                for (int i = 0; i < count; i++) {
                    placesPhotoRedisService.warmPhotoCache(placeId, i, photos.get(i).getName());
                }
                success++;
            } catch (Exception e) {
                log.error("[Places 캐시 워밍] 실패: bakeryId={}", bakeryId, e);
                fail++;
            }
        }
        if (fail > 0) {
            log.warn("[Places 캐시 워밍] 완료: success={}, skip={}, fail={}", success, skip, fail);
        } else {
            log.debug("[Places 캐시 워밍] 완료: success={}, skip={}", success, skip);
        }
    }

    private double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2)
                        + Math.cos(Math.toRadians(lat1))
                                * Math.cos(Math.toRadians(lat2))
                                * Math.sin(dLon / 2)
                                * Math.sin(dLon / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}

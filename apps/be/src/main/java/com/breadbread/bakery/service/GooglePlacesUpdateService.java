package com.breadbread.bakery.service;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.PlaceResult;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
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

        Optional<PlaceResult> placeOpt =
                googlePlacesClient.searchBakeryPlace(
                        bakery.getName(), bakery.getLatitude(), bakery.getLongitude());

        if (placeOpt.isEmpty()) {
            log.warn("[Places 동기화] 장소 검색 결과 없음: bakeryId={}, name={}", bakeryId, bakery.getName());
            return false;
        }

        PlaceResult place = placeOpt.get();

        String dong = extractDong(place);
        if (dong != null) {
            bakery.updateDong(dong);
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
                newImages.add(
                        BakeryImage.builder()
                                .placeId(place.getId())
                                .displayOrder(i + 1)
                                .bakery(bakery)
                                .build());
            }
            bakeryImageRepository.saveAll(newImages);

            // Text Search 응답의 photoName으로 바로 캐시 워밍 (Place Details 콜 생략)
            List<GooglePlacesClient.PlacePhoto> photos = place.getPhotos();
            for (int i = 0; i < photoCount; i++) {
                placesPhotoRedisService.warmPhotoCache(place.getId(), i, photos.get(i).getName());
            }
        }

        log.info(
                "[Places 동기화] 완료: bakeryId={}, dong={}, photoCount={}", bakeryId, dong, photoCount);
        return true;
    }

    public void syncAllBakeries() {
        List<Bakery> bakeries = bakeryRepository.findAllByActiveTrue();
        log.info("[Places 동기화] 전체 동기화 시작: count={}", bakeries.size());
        int success = 0, skip = 0, fail = 0;
        for (Bakery bakery : bakeries) {
            try {
                if (self.syncBakery(bakery.getId())) success++; // 프록시 경유로 REQUIRES_NEW 적용
                else skip++;
            } catch (Exception e) {
                log.error("[Places 동기화] 실패: bakeryId={}", bakery.getId(), e);
                fail++;
            }
        }
        log.info("[Places 동기화] 전체 동기화 완료: success={}, skip={}, fail={}", success, skip, fail);
    }

    @Scheduled(cron = "0 0 4 * * *", zone = "Asia/Seoul")
    public void warmAllPhotoCaches() {
        List<Long> bakeryIds =
                bakeryRepository.findAllByActiveTrue().stream().map(Bakery::getId).toList();
        if (bakeryIds.isEmpty()) return;

        log.info("[Places 캐시 워밍] 시작: count={}", bakeryIds.size());
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
            String placeId =
                    images.stream()
                            .map(BakeryImage::getPlaceId)
                            .filter(id -> id != null)
                            .findFirst()
                            .orElse(null);
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
        log.info("[Places 캐시 워밍] 완료: success={}, skip={}, fail={}", success, skip, fail);
    }

    private String extractDong(PlaceResult place) {
        if (place.getAddressComponents() == null) return null;
        return place.getAddressComponents().stream()
                .filter(
                        comp ->
                                comp.getTypes() != null
                                        && comp.getTypes().contains("sublocality_level_2"))
                .findFirst()
                .map(GooglePlacesClient.AddressComponent::getLongText)
                .orElse(null);
    }
}

package com.breadbread.bakery.service;

import com.breadbread.bakery.client.KakaoLocalClient;
import com.breadbread.bakery.client.KakaoLocalClient.Place;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse;
import com.breadbread.bakery.dto.response.KakaoSyncResultResponse.BakeryEntry;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoLocalUpdateService {

    private static final double MAX_DISTANCE_METERS = 200.0;

    private final KakaoLocalClient kakaoLocalClient;
    private final BakeryRepository bakeryRepository;

    // syncAllBakeries에서 REQUIRES_NEW가 적용되도록 프록시를 통해 호출한다.
    @Lazy @Autowired private KakaoLocalUpdateService self;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public boolean syncBakery(Long bakeryId) {
        Bakery bakery =
                bakeryRepository
                        .findById(bakeryId)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        return sync(bakery);
    }

    public KakaoSyncResultResponse syncAllBakeries() {
        List<Bakery> bakeries =
                bakeryRepository.findAllByActiveTrueAndStatus(BakeryStatus.APPROVED);
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
                log.warn(
                        "[카카오 업데이트] 실패: bakeryId={}, name={}", bakery.getId(), bakery.getName(), e);
                failed.add(BakeryEntry.builder().id(bakery.getId()).name(bakery.getName()).build());
            }
        }
        log.info(
                "[카카오 업데이트] 전체 완료: success={}, skipped={}, failed={}, total={}",
                success,
                skipped.size(),
                failed.size(),
                bakeries.size());
        return KakaoSyncResultResponse.builder()
                .successCount(success)
                .skippedCount(skipped.size())
                .failedCount(failed.size())
                .skippedBakeries(skipped)
                .failedBakeries(failed)
                .build();
    }

    private boolean sync(Bakery bakery) {
        List<Place> places = kakaoLocalClient.searchBakeries(bakery.getName());
        Place matched = findBestMatch(bakery, places);
        if (matched == null) {
            log.debug("[카카오 업데이트] 매칭 실패: bakeryId={}, name={}", bakery.getId(), bakery.getName());
            return false;
        }

        if (matched.getPhone() != null && !matched.getPhone().isBlank()) {
            bakery.updatePhone(matched.getPhone());
        }

        String addressName = matched.getAddressName();

        String dong = extractDong(addressName);
        if (dong != null) {
            bakery.updateDong(dong);
        }

        String region = extractRegion(addressName);
        if (region != null) {
            bakery.updateRegion(region);
        }

        String address =
                matched.getRoadAddressName() != null && !matched.getRoadAddressName().isBlank()
                        ? matched.getRoadAddressName()
                        : addressName;
        if (address != null && !address.isBlank()) {
            bakery.updateAddress(address);
        }

        try {
            double lat = Double.parseDouble(matched.getY());
            double lng = Double.parseDouble(matched.getX());
            bakery.updateCoordinates(lat, lng);
        } catch (NumberFormatException e) {
            log.warn("[카카오 업데이트] 좌표 파싱 실패: bakeryId={}", bakery.getId());
        }

        return true;
    }

    private Place findBestMatch(Bakery bakery, List<Place> places) {
        String normalizedName = normalize(bakery.getName());
        return places.stream()
                .filter(p -> p.getX() != null && p.getY() != null)
                .filter(p -> normalize(p.getPlaceName()).equals(normalizedName))
                .min(
                        Comparator.comparingDouble(
                                p -> distance(bakery.getLatitude(), bakery.getLongitude(), p)))
                .filter(
                        p ->
                                distance(bakery.getLatitude(), bakery.getLongitude(), p)
                                        <= MAX_DISTANCE_METERS)
                .orElse(null);
    }

    private double distance(double lat1, double lng1, Place place) {
        try {
            double lat2 = Double.parseDouble(place.getY());
            double lng2 = Double.parseDouble(place.getX());
            double dLat = Math.toRadians(lat2 - lat1);
            double dLng = Math.toRadians(lng2 - lng1);
            double a =
                    Math.sin(dLat / 2) * Math.sin(dLat / 2)
                            + Math.cos(Math.toRadians(lat1))
                                    * Math.cos(Math.toRadians(lat2))
                                    * Math.sin(dLng / 2)
                                    * Math.sin(dLng / 2);
            return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        } catch (NumberFormatException e) {
            return Double.MAX_VALUE;
        }
    }

    private String extractRegion(String addressName) {
        if (addressName == null) return null;
        String[] parts = addressName.split(" ");
        if (parts.length < 2) return null;
        String city = parts[0].replaceAll("(광역시|특별시|특별자치시|특별자치도|도|시)$", "");
        String gu = Arrays.stream(parts).filter(p -> p.endsWith("구")).findFirst().orElse(null);
        return gu != null ? city + " " + gu : null;
    }

    private String extractDong(String addressName) {
        if (addressName == null) return null;
        return Arrays.stream(addressName.split(" "))
                .filter(p -> p.endsWith("동"))
                .findFirst()
                .map(s -> s.replaceAll("[^가-힣]", ""))
                .filter(s -> !s.isEmpty())
                .orElse(null);
    }

    private String normalize(String name) {
        if (name == null) return "";
        return name.replaceAll("[\\s\\p{Punct}]", "").toLowerCase();
    }
}

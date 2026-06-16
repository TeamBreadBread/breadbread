package com.breadbread.bakery.service;

import static com.breadbread.bakery.service.BakeryImportConstants.FRANCHISE_NAMES;

import com.breadbread.bakery.client.KakaoLocalClient;
import com.breadbread.bakery.client.KakaoLocalClient.Place;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class KakaoLocalImportService {

    private final KakaoLocalClient kakaoLocalClient;
    private final BakeryRepository bakeryRepository;

    @Transactional
    public List<String> importByKeyword(String keyword) {
        List<Place> places = kakaoLocalClient.searchBakeries(keyword);
        List<String> savedNames = new ArrayList<>();

        for (Place place : places) {
            if (place.getPlaceName() == null) continue;
            if (place.getX() == null || place.getY() == null) continue;

            String name = place.getPlaceName();
            String address =
                    place.getRoadAddressName() != null
                            ? place.getRoadAddressName()
                            : place.getAddressName();
            if (address == null) continue;

            double lng, lat;
            try {
                lng = Double.parseDouble(place.getX());
                lat = Double.parseDouble(place.getY());
            } catch (NumberFormatException e) {
                log.warn(
                        "[카카오 임포트] 좌표 파싱 실패, 건너뜀: name={}, x={}, y={}",
                        name,
                        place.getX(),
                        place.getY());
                continue;
            }

            if (!isBakeryCategory(place.getCategoryName())) continue;
            if (isFranchise(name)) continue;
            if (bakeryRepository.existsByNameAndAddress(name, address)) continue;
            if (isDuplicateNearby(name, lat, lng)) continue;

            Bakery bakery =
                    Bakery.builder()
                            .name(name)
                            .address(address)
                            .region(extractRegion(place.getAddressName()))
                            .dong(extractDong(place.getAddressName()))
                            .mapLink(place.getPlaceUrl())
                            .latitude(lat)
                            .longitude(lng)
                            .phone(place.getPhone())
                            .holidayClosed(false)
                            .drinkAvailable(false)
                            .dineInAvailable(false)
                            .parkingAvailable(false)
                            .build();
            bakeryRepository.save(bakery);
            savedNames.add(name);
        }

        log.info(
                "[카카오 임포트] keyword={}, saved={}, total={}",
                keyword,
                savedNames.size(),
                places.size());
        return savedNames;
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

    private String extractRegion(String addressName) {
        if (addressName == null) return null;
        String[] parts = addressName.split(" ");
        if (parts.length < 2) return null;
        String city = parts[0].replaceAll("(광역시|특별시|특별자치시|특별자치도|도|시)$", "");
        String gu = Arrays.stream(parts).filter(p -> p.endsWith("구")).findFirst().orElse(null);
        return gu != null ? city + " " + gu : null;
    }

    private boolean isDuplicateNearby(String name, double lat, double lng) {
        String normalized = normalize(name);
        return bakeryRepository.findAllNearby(lat, lng, 100).stream()
                .anyMatch(b -> normalize(b.getName()).equals(normalized));
    }

    private String normalize(String name) {
        return name.replaceAll("[\\s\\p{Punct}]", "").toLowerCase();
    }

    private boolean isBakeryCategory(String categoryName) {
        if (categoryName == null) return false;
        return categoryName.contains("베이커리")
                || categoryName.contains("제과")
                || categoryName.contains("빵");
    }

    private boolean isFranchise(String name) {
        return FRANCHISE_NAMES.stream().anyMatch(name::contains);
    }
}

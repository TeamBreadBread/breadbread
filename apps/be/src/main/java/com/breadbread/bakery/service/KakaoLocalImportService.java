package com.breadbread.bakery.service;

import static com.breadbread.bakery.service.BakeryImportConstants.FRANCHISE_NAMES;

import com.breadbread.bakery.client.KakaoLocalClient;
import com.breadbread.bakery.client.KakaoLocalClient.Place;
import com.breadbread.bakery.dto.imports.BakeryImportCache;
import com.breadbread.bakery.dto.imports.BakeryImportCandidate;
import com.breadbread.bakery.dto.response.BakeryImportPreviewResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
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
    private final BakeryImportRedisService bakeryImportRedisService;

    /** 키워드로 검색해 후보 목록을 Redis에 캐시하고, 관리자가 확인할 프리뷰를 반환한다. DB에는 아무것도 저장하지 않는다. */
    @Transactional(readOnly = true)
    public BakeryImportPreviewResponse searchByKeyword(String keyword) {
        List<Place> places = kakaoLocalClient.searchBakeries(keyword);
        List<BakeryImportCandidate> candidates = new ArrayList<>();

        for (Place place : places) {
            if (place.getId() == null) continue;
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
                        "[카카오 검색] 좌표 파싱 실패, 건너뜀: name={}, x={}, y={}",
                        name,
                        place.getX(),
                        place.getY());
                continue;
            }

            if (!isBakeryCategory(place.getCategoryName())) continue;
            if (isFranchise(name)) continue;
            if (bakeryRepository.existsByNameAndAddress(name, address)) continue;
            if (isDuplicateNearby(name, lat, lng)) continue;

            candidates.add(
                    BakeryImportCandidate.builder()
                            .externalId(place.getId())
                            .name(name)
                            .address(address)
                            .region(extractRegion(place.getAddressName()))
                            .dong(extractDong(place.getAddressName()))
                            .latitude(lat)
                            .longitude(lng)
                            .phone(place.getPhone())
                            .mapLink(place.getPlaceUrl())
                            .build());
        }

        String searchId = UUID.randomUUID().toString();
        bakeryImportRedisService.saveCandidates(searchId, keyword, candidates);

        log.info(
                "[카카오 검색] keyword={}, candidates={}, total={}",
                keyword,
                candidates.size(),
                places.size());

        return BakeryImportPreviewResponse.builder()
                .searchId(searchId)
                .keyword(keyword)
                .candidates(candidates)
                .build();
    }

    /** 프리뷰에서 선택한 candidateId들만 DB에 PENDING 상태로 저장한다. */
    @Transactional
    public List<String> confirmImport(String searchId, List<String> candidateIds) {
        BakeryImportCache cache = bakeryImportRedisService.getCandidatesOrThrow(searchId);

        Map<String, BakeryImportCandidate> candidateMap =
                cache.getCandidates().stream()
                        .filter(c -> c.getExternalId() != null)
                        .collect(
                                Collectors.toMap(
                                        BakeryImportCandidate::getExternalId, c -> c, (a, b) -> a));

        List<String> savedNames = new ArrayList<>();
        for (String candidateId : candidateIds) {
            BakeryImportCandidate candidate = candidateMap.get(candidateId);
            if (candidate == null) {
                throw new CustomException(ErrorCode.BAKERY_IMPORT_CANDIDATE_NOT_FOUND);
            }
            if (bakeryRepository.existsByNameAndAddress(
                    candidate.getName(), candidate.getAddress())) continue;

            Bakery bakery =
                    Bakery.builder()
                            .name(candidate.getName())
                            .address(candidate.getAddress())
                            .region(candidate.getRegion())
                            .dong(candidate.getDong())
                            .mapLink(candidate.getMapLink())
                            .latitude(candidate.getLatitude())
                            .longitude(candidate.getLongitude())
                            .phone(candidate.getPhone())
                            .holidayClosed(false)
                            .drinkAvailable(false)
                            .dineInAvailable(false)
                            .parkingAvailable(false)
                            .build();
            bakeryRepository.save(bakery);
            savedNames.add(candidate.getName());
        }

        log.info(
                "[카카오 임포트 확정] searchId={}, saved={}, requested={}",
                searchId,
                savedNames.size(),
                candidateIds.size());
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

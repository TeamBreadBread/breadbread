package com.breadbread.bakery.service;

import static com.breadbread.bakery.service.BakeryImportConstants.FRANCHISE_NAMES;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.PlaceResult;
import com.breadbread.bakery.dto.imports.BakeryImportCache;
import com.breadbread.bakery.dto.imports.BakeryImportCandidate;
import com.breadbread.bakery.dto.response.BakeryImportPreviewResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GooglePlacesImportService {

    private static final DayOfWeek[] GOOGLE_DAY_MAP = {
        DayOfWeek.SUNDAY,
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
        DayOfWeek.SATURDAY
    };

    private final GooglePlacesClient googlePlacesClient;
    private final BakeryRepository bakeryRepository;
    private final BakeryImportRedisService bakeryImportRedisService;

    /** 키워드로 검색해 후보 목록을 Redis에 캐시하고, 관리자가 확인할 프리뷰를 반환한다. DB에는 아무것도 저장하지 않는다. */
    @Transactional(readOnly = true)
    public BakeryImportPreviewResponse searchByKeyword(String keyword) {
        List<PlaceResult> places = googlePlacesClient.searchBakeriesByKeyword(keyword);
        List<BakeryImportCandidate> candidates = new ArrayList<>();

        for (PlaceResult place : places) {
            if (place.getId() == null) continue;
            if (place.getDisplayName() == null || place.getDisplayName().getText() == null)
                continue;
            if (place.getFormattedAddress() == null) continue;
            if (place.getLocation() == null) continue;

            String name = place.getDisplayName().getText();
            String address = place.getFormattedAddress();

            if (isFranchise(name)) continue;
            if (bakeryRepository.existsByPlaceId(place.getId())) continue;
            if (bakeryRepository.existsByNameAndAddress(name, address)) continue;
            if (isDuplicateNearby(
                    name, place.getLocation().getLatitude(), place.getLocation().getLongitude()))
                continue;

            BusinessHoursParts hours = parseOpeningHours(place);

            candidates.add(
                    BakeryImportCandidate.builder()
                            .externalId(place.getId())
                            .name(name)
                            .address(address)
                            .region(extractRegion(place))
                            .dong(extractDong(place))
                            .latitude(place.getLocation().getLatitude())
                            .longitude(place.getLocation().getLongitude())
                            .phone(place.getNationalPhoneNumber())
                            .mapLink(place.getGoogleMapsUri())
                            .weekdayOpen(hours.weekdayOpen())
                            .weekdayClose(hours.weekdayClose())
                            .weekendOpen(hours.weekendOpen())
                            .weekendClose(hours.weekendClose())
                            .closedDays(hours.closedDays())
                            .build());
        }

        String searchId = UUID.randomUUID().toString();
        bakeryImportRedisService.saveCandidates(searchId, keyword, candidates);

        log.info(
                "[Places 검색] keyword={}, candidates={}, total={}",
                keyword,
                candidates.size(),
                places.size());

        return BakeryImportPreviewResponse.builder()
                .searchId(searchId)
                .keyword(keyword)
                .candidates(candidates)
                .build();
    }

    /** 프리뷰에서 선택한 candidateId(placeId)들만 DB에 PENDING 상태로 저장한다. */
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
            if (candidate.getExternalId() != null
                    && bakeryRepository.existsByPlaceId(candidate.getExternalId())) continue;
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
                            .weekdayOpen(candidate.getWeekdayOpen())
                            .weekdayClose(candidate.getWeekdayClose())
                            .weekendOpen(candidate.getWeekendOpen())
                            .weekendClose(candidate.getWeekendClose())
                            .closedDays(candidate.getClosedDays())
                            .holidayClosed(false)
                            .drinkAvailable(false)
                            .dineInAvailable(false)
                            .parkingAvailable(false)
                            .placeId(candidate.getExternalId())
                            .build();
            bakeryRepository.save(bakery);
            savedNames.add(candidate.getName());
        }

        log.info(
                "[Places 임포트 확정] searchId={}, saved={}, requested={}",
                searchId,
                savedNames.size(),
                candidateIds.size());
        return savedNames;
    }

    private BusinessHoursParts parseOpeningHours(GooglePlacesClient.PlaceResult place) {
        LocalTime weekdayOpen = null;
        LocalTime weekdayClose = null;
        LocalTime weekendOpen = null;
        LocalTime weekendClose = null;
        Set<DayOfWeek> closedDays = new HashSet<>();

        if (place.getRegularOpeningHours() == null
                || place.getRegularOpeningHours().getPeriods() == null) {
            return new BusinessHoursParts(
                    weekdayOpen, weekdayClose, weekendOpen, weekendClose, closedDays);
        }

        List<GooglePlacesClient.OpeningPeriod> periods =
                place.getRegularOpeningHours().getPeriods();

        Set<Integer> openGoogleDays =
                periods.stream()
                        .filter(p -> p.getOpen() != null)
                        .map(p -> p.getOpen().getDay())
                        .collect(Collectors.toSet());

        for (int i = 0; i < 7; i++) {
            if (!openGoogleDays.contains(i)) closedDays.add(GOOGLE_DAY_MAP[i]);
        }

        for (GooglePlacesClient.OpeningPeriod period : periods) {
            if (period.getOpen() == null || period.getClose() == null) continue;
            int day = period.getOpen().getDay();
            LocalTime open = LocalTime.of(period.getOpen().getHour(), period.getOpen().getMinute());
            LocalTime close =
                    LocalTime.of(period.getClose().getHour(), period.getClose().getMinute());
            // 0=Sunday, 6=Saturday
            if (day == 0 || day == 6) {
                if (weekendOpen == null) {
                    weekendOpen = open;
                    weekendClose = close;
                }
            } else {
                if (weekdayOpen == null) {
                    weekdayOpen = open;
                    weekdayClose = close;
                }
            }
        }

        return new BusinessHoursParts(
                weekdayOpen, weekdayClose, weekendOpen, weekendClose, closedDays);
    }

    private record BusinessHoursParts(
            LocalTime weekdayOpen,
            LocalTime weekdayClose,
            LocalTime weekendOpen,
            LocalTime weekendClose,
            Set<DayOfWeek> closedDays) {}

    private String extractDong(GooglePlacesClient.PlaceResult place) {
        if (place.getAddressComponents() == null) return null;
        return place.getAddressComponents().stream()
                .filter(c -> c.getTypes() != null && c.getTypes().contains("sublocality_level_2"))
                .findFirst()
                .map(GooglePlacesClient.AddressComponent::getLongText)
                .map(s -> s.replaceAll("[^가-힣]", ""))
                .filter(s -> !s.isEmpty())
                .orElse(null);
    }

    private String extractRegion(GooglePlacesClient.PlaceResult place) {
        if (place.getAddressComponents() == null) return null;

        String gu =
                place.getAddressComponents().stream()
                        .filter(
                                c ->
                                        c.getTypes() != null
                                                && c.getTypes().contains("sublocality_level_1"))
                        .findFirst()
                        .map(GooglePlacesClient.AddressComponent::getLongText)
                        .orElse(null);

        if (gu == null) return null;

        String city =
                place.getAddressComponents().stream()
                        .filter(c -> c.getTypes() != null && c.getTypes().contains("locality"))
                        .findFirst()
                        .map(GooglePlacesClient.AddressComponent::getLongText)
                        .map(s -> s.replaceAll("(광역시|특별시|특별자치시|특별자치도|도|시)$", ""))
                        .orElse(null);

        return city != null ? city + " " + gu : gu;
    }

    private boolean isDuplicateNearby(String name, double lat, double lng) {
        String normalized = normalize(name);
        return bakeryRepository.findAllNearby(lat, lng, 100).stream()
                .anyMatch(b -> normalize(b.getName()).equals(normalized));
    }

    private String normalize(String name) {
        return name.replaceAll("[\\s\\p{Punct}]", "").toLowerCase();
    }

    private boolean isFranchise(String name) {
        return FRANCHISE_NAMES.stream().anyMatch(name::contains);
    }
}

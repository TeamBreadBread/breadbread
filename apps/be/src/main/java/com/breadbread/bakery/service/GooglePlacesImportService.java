package com.breadbread.bakery.service;

import static com.breadbread.bakery.service.BakeryImportConstants.FRANCHISE_NAMES;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.PlaceResult;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
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

    @Transactional
    public List<String> importByKeyword(String keyword) {
        List<PlaceResult> places = googlePlacesClient.searchBakeriesByKeyword(keyword);
        List<String> savedNames = new ArrayList<>();

        for (PlaceResult place : places) {
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

            LocalTime weekdayOpen = null;
            LocalTime weekdayClose = null;
            LocalTime weekendOpen = null;
            LocalTime weekendClose = null;
            Set<DayOfWeek> closedDays = new HashSet<>();

            if (place.getRegularOpeningHours() != null
                    && place.getRegularOpeningHours().getPeriods() != null) {
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
                    LocalTime open =
                            LocalTime.of(period.getOpen().getHour(), period.getOpen().getMinute());
                    LocalTime close =
                            LocalTime.of(
                                    period.getClose().getHour(), period.getClose().getMinute());
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
            }

            Bakery bakery =
                    Bakery.builder()
                            .name(name)
                            .address(address)
                            .region(extractRegion(place))
                            .dong(extractDong(place))
                            .mapLink(place.getGoogleMapsUri())
                            .latitude(place.getLocation().getLatitude())
                            .longitude(place.getLocation().getLongitude())
                            .phone(place.getNationalPhoneNumber())
                            .weekdayOpen(weekdayOpen)
                            .weekdayClose(weekdayClose)
                            .weekendOpen(weekendOpen)
                            .weekendClose(weekendClose)
                            .closedDays(closedDays)
                            .holidayClosed(false)
                            .drinkAvailable(false)
                            .dineInAvailable(false)
                            .parkingAvailable(false)
                            .placeId(place.getId())
                            .build();
            bakeryRepository.save(bakery);
            savedNames.add(name);
        }

        log.info(
                "[Places 임포트] keyword={}, saved={}, total={}",
                keyword,
                savedNames.size(),
                places.size());
        return savedNames;
    }

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

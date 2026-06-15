package com.breadbread.bakery.service;

import com.breadbread.bakery.client.GooglePlacesClient;
import com.breadbread.bakery.client.GooglePlacesClient.PlaceResult;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import java.time.DayOfWeek;
import java.time.LocalTime;
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

    private static final Set<String> FRANCHISE_NAMES =
            Set.of(
                    "파리바게뜨", "뚜레쥬르", "던킨", "스타벅스", "투썸플레이스", "메가커피", "메가MGC커피", "이디야", "컴포즈커피",
                    "빽다방", "공차", "할리스커피", "블루보틀", "더벤티", "아마스빈", "엔젤리너스", "탐앤탐스");

    private final GooglePlacesClient googlePlacesClient;
    private final BakeryRepository bakeryRepository;

    @Transactional
    public int importByKeyword(String keyword) {
        List<PlaceResult> places = googlePlacesClient.searchBakeriesByKeyword(keyword);
        int saved = 0;

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
            saved++;
        }

        log.info("[Places 임포트] keyword={}, saved={}, total={}", keyword, saved, places.size());
        return saved;
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

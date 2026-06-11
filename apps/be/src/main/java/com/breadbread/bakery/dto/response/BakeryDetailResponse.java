package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BusinessHours;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryDetailResponse {
    private Long id;
    private String name;
    private String address;
    private String dong;
    private Double lat;
    private Double lng;
    private List<String> imageUrls;
    private LocalTime openTime;
    private LocalTime closeTime;
    private LocalTime weekdayOpen;
    private LocalTime weekdayClose;
    private LocalTime weekendOpen;
    private LocalTime weekendClose;
    private List<String> closedDays;
    private String phone;
    private Double rating;
    private Long reviewCount;
    private List<BakeryBreadResponse> breads;
    private Long likeCount;
    private boolean liked;

    public static BakeryDetailResponse from(
            Bakery bakery,
            Long likeCount,
            boolean liked,
            Long reviewCount,
            List<String> resolvedImageUrls,
            Double rating) {
        BusinessHours bh = bakery.getBusinessHours();

        List<BakeryBreadResponse> breads =
                bakery.getBreads() == null
                        ? Collections.emptyList()
                        : bakery.getBreads().stream().map(BakeryBreadResponse::from).toList();

        Set<DayOfWeek> closed = bakery.getClosedDays();
        List<String> closedDayNames =
                closed == null || closed.isEmpty()
                        ? Collections.emptyList()
                        : closed.stream()
                                .map(DayOfWeek::name)
                                .sorted()
                                .collect(Collectors.toList());

        return BakeryDetailResponse.builder()
                .id(bakery.getId())
                .name(bakery.getName())
                .address(bakery.getAddress())
                .dong(bakery.getDong())
                .lat(bakery.getLatitude())
                .lng(bakery.getLongitude())
                .phone(bakery.getPhone())
                .rating(rating != null ? rating : 0.0)
                .imageUrls(resolvedImageUrls)
                .openTime(bh != null ? bh.getTodayOpen() : null)
                .closeTime(bh != null ? bh.getTodayClose() : null)
                .weekdayOpen(bh != null ? bh.getWeekdayOpen() : null)
                .weekdayClose(bh != null ? bh.getWeekdayClose() : null)
                .weekendOpen(bh != null ? bh.getWeekendOpen() : null)
                .weekendClose(bh != null ? bh.getWeekendClose() : null)
                .closedDays(closedDayNames)
                .reviewCount(reviewCount != null ? reviewCount : 0L)
                .breads(breads)
                .likeCount(likeCount)
                .liked(liked)
                .build();
    }
}

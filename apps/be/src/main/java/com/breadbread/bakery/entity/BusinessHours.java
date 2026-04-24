package com.breadbread.bakery.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;


@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessHours {
    private LocalTime weekdayOpen;
    private LocalTime weekdayClose;
    private LocalTime weekendOpen;
    private LocalTime weekendClose;
    private boolean holidayClosed;
    private LocalTime lastOrderTime;
    private String closedDayNote;      // 격주 월 등 비정형 (표시용)

    @Builder
    public BusinessHours(LocalTime weekdayOpen, LocalTime weekdayClose,
                         LocalTime weekendOpen, LocalTime weekendClose,
                         boolean holidayClosed, LocalTime lastOrderTime) {
        this.weekdayOpen = weekdayOpen;
        this.weekdayClose = weekdayClose;
        this.weekendOpen = weekendOpen;
        this.weekendClose = weekendClose;
        this.holidayClosed = holidayClosed;
        this.lastOrderTime = lastOrderTime;
    }

    public boolean isOpenNow(LocalTime now, DayOfWeek today, Set<DayOfWeek> closedDays) {
        // 정기 휴무일 체크
        if (closedDays != null && closedDays.contains(today)) {
            return false;
        }

        // 주말/평일 구분
        boolean isWeekend = today == DayOfWeek.SATURDAY || today == DayOfWeek.SUNDAY;
        LocalTime open = isWeekend ? weekendOpen : weekdayOpen;
        LocalTime close = isWeekend ? weekendClose : weekdayClose;

        if (open == null || close == null) {
            return false;
        }

        // 시간 체크
        return !now.isBefore(open) && !now.isAfter(close);
    }

    public String getBusinessHoursText(DayOfWeek day) {
        boolean isWeekend = day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
        LocalTime open = isWeekend ? weekendOpen : weekdayOpen;
        LocalTime close = isWeekend ? weekendClose : weekdayClose;

        if (open == null || close == null) {
            return "영업시간 미정";
        }

        return String.format("%s - %s", open, close);
    }
}

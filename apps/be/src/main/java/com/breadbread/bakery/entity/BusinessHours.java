package com.breadbread.bakery.entity;

import jakarta.persistence.*;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Set;
import lombok.*;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BusinessHours {
    private LocalTime weekdayOpen;
    private LocalTime weekdayClose;
    private LocalTime weekendOpen;
    private LocalTime weekendClose;
    private boolean holidayClosed;
    private String lastOrderTime;
    private String closedDayNote; // 격주 월 등 비정형 (표시용)

    @Builder
    public BusinessHours(
            LocalTime weekdayOpen,
            LocalTime weekdayClose,
            LocalTime weekendOpen,
            LocalTime weekendClose,
            boolean holidayClosed,
            String lastOrderTime) {
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
        LocalTime open = isWeekend(today) ? weekendOpen : weekdayOpen;
        LocalTime close = isWeekend(today) ? weekendClose : weekdayClose;
        if (open == null || close == null) {
            return false;
        }

        // 시간 체크
        return !now.isBefore(open) && !now.isAfter(close);
    }

    public String getBusinessHoursText(DayOfWeek day) {
        LocalTime open = isWeekend(day) ? weekendOpen : weekdayOpen;
        LocalTime close = isWeekend(day) ? weekendClose : weekdayClose;
        if (open == null || close == null) return "영업시간 미정";
        return String.format("%s - %s", open, close);
    }

    public LocalTime getTodayOpen() {
        return isWeekend(LocalDate.now().getDayOfWeek()) ? weekendOpen : weekdayOpen;
    }

    public LocalTime getTodayClose() {
        return isWeekend(LocalDate.now().getDayOfWeek()) ? weekendClose : weekdayClose;
    }

    private boolean isWeekend(DayOfWeek day) {
        return day == DayOfWeek.SATURDAY || day == DayOfWeek.SUNDAY;
    }
}

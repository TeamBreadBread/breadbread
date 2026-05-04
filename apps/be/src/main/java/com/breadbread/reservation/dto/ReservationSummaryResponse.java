package com.breadbread.reservation.dto;

import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class ReservationSummaryResponse {
    private Long id;
    private String courseNameSnapshot;
    private String departure;
    private LocalDate departureDate;
    private LocalTime departureTime;
    private int headCount;
    private ReservationStatus status;
    private LocalDateTime createdAt;

    public static ReservationSummaryResponse from(Reservation reservation) {
        return ReservationSummaryResponse.builder()
                .id(reservation.getId())
                .courseNameSnapshot(reservation.getCourseNameSnapshot())
                .departure(reservation.getDeparture())
                .departureDate(reservation.getDepartureDate())
                .departureTime(reservation.getDepartureTime())
                .headCount(reservation.getHeadCount())
                .status(reservation.getStatus())
                .createdAt(reservation.getCreatedAt())
                .build();
    }
}

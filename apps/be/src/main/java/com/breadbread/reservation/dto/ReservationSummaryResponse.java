package com.breadbread.reservation.dto;

import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReservationSummaryResponse {
    private Long id;
    private String courseNameSnapshot;
    private String departure;
    private LocalDate departureDate;
    private LocalTime departureTime;
    private ReservationStatus status;
    private LocalDateTime createdAt;
    private long quoteAmount;

    public static ReservationSummaryResponse from(Reservation reservation) {
        return ReservationSummaryResponse.builder()
                .id(reservation.getId())
                .courseNameSnapshot(reservation.getCourseNameSnapshot())
                .departure(reservation.getDeparture())
                .departureDate(reservation.getDepartureDate())
                .departureTime(reservation.getDepartureTime())
                .status(reservation.getStatus())
                .createdAt(reservation.getCreatedAt())
                .quoteAmount(reservation.getQuotedAmount())
                .build();
    }
}

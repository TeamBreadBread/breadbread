package com.breadbread.reservation.dto;

import com.breadbread.course.dto.CourseSummaryResponse;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Getter
@Builder
public class ReservationDetailResponse {
    private Long id;
    private LocalDate departureDate;
    private LocalTime departureTime;
    private String departure;
    private ReservationStatus status;
    private LocalDateTime createdAt;
    private CourseSummaryResponse course;
    private int headCount;
    private Integer quotedAmount;
    private LocalDateTime cancelledAt;

    public static ReservationDetailResponse from(Reservation reservation, CourseSummaryResponse course) {
        return ReservationDetailResponse.builder()
                .id(reservation.getId())
                .departureDate(reservation.getDepartureDate())
                .departureTime(reservation.getDepartureTime())
                .departure(reservation.getDeparture())
                .status(reservation.getStatus())
                .createdAt(reservation.getCreatedAt())
                .course(course)
                .headCount(reservation.getHeadCount())
                .quotedAmount(reservation.getQuotedAmount())
                .cancelledAt(reservation.getCancelledAt())
                .build();
    }
}

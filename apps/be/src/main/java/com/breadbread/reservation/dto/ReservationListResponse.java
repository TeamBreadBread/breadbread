package com.breadbread.reservation.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ReservationListResponse {
    private List<ReservationSummary> reservations;
}

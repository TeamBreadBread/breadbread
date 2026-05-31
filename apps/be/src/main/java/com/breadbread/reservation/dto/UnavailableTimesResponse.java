package com.breadbread.reservation.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class UnavailableTimesResponse {
    private List<String> unavailableTimes;
}

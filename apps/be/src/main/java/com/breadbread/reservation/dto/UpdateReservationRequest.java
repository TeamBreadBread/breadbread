package com.breadbread.reservation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class UpdateReservationRequest {

    @Schema(description = "출발 날짜", example = "2025-06-01")
    @FutureOrPresent(message = "출발 날짜는 오늘 이후여야 합니다.")
    private LocalDate departureDate;

    @Schema(description = "출발 시간 (09:00 ~ 13:00)", example = "10:00")
    private LocalTime departureTime;

    @Schema(description = "출발 위치 주소", example = "서울특별시 마포구 합정동 123-45")
    private String departure;

    @Schema(description = "출발 위치 위도", example = "37.5497")
    private Double lat;

    @Schema(description = "출발 위치 경도", example = "126.9137")
    private Double lng;

    @Schema(description = "인원수 (최소 1명)", example = "2")
    @Min(value = 1, message = "인원수는 최소 1명입니다.")
    private Integer headCount;
}

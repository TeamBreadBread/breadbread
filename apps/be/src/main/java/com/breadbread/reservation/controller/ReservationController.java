package com.breadbread.reservation.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.reservation.dto.CreateReservationRequest;
import com.breadbread.reservation.dto.ReservationDetailResponse;
import com.breadbread.reservation.dto.ReservationSummaryResponse;
import com.breadbread.reservation.dto.UpdateReservationRequest;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "예약")
@RestController
@RequestMapping("/reservations")
@RequiredArgsConstructor
public class ReservationController {
    private final ReservationService reservationService;

    @Operation(summary = "내 예약 목록 조회", description = "status 파라미터 생략 시 전체 조회")
    @GetMapping
    public ApiResponse<List<ReservationSummaryResponse>> getMyReservations(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Parameter(
                            description =
                                    "예약 상태 필터 (PENDING: 대기, CONFIRMED: 확정, COMPLETED: 완료, CANCELLED: 취소). 생략 시 전체 조회")
                    @RequestParam(required = false)
                    ReservationStatus status) {
        return ApiResponse.ok(reservationService.getMyReservations(userDetails.getId(), status));
    }

    @Operation(summary = "예약 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<ReservationDetailResponse> getReservation(
            @PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(reservationService.getReservation(userDetails.getId(), id));
    }

    @Operation(summary = "예약 생성")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ApiResponse<Long> createReservation(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateReservationRequest request) {
        return ApiResponse.ok(reservationService.createReservation(userDetails.getId(), request));
    }

    @Operation(summary = "예약 수정")
    @PatchMapping("/{id}")
    public ApiResponse<Void> updateReservation(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateReservationRequest request) {
        reservationService.updateReservation(userDetails.getId(), id, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "예약 취소")
    @PatchMapping("/{id}/cancel")
    public ApiResponse<Void> cancelReservation(
            @PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        reservationService.cancelReservation(userDetails.getId(), id);
        return ApiResponse.ok();
    }
}

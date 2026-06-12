package com.breadbread.trend.controller;

import com.breadbread.global.dto.ApiResponse;
import com.breadbread.trend.dto.BakeryTrendTagAdminListResponse;
import com.breadbread.trend.service.TrendService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "트렌드 - 관리자")
@RestController
@RequestMapping("/admin/trends")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminTrendController {

    private final TrendService trendService;

    @Operation(
            summary = "트렌드 태그 전체 목록 조회 (관리자)",
            description = "수집된 BakeryTrendTag 전체 레코드를 최신순으로 조회합니다.")
    @Parameters({
        @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
        @Parameter(name = "size", description = "페이지 크기 (기본값: 20)"),
        @Parameter(name = "from", description = "조회 시작 날짜 (형식: yyyy-MM-dd, 예: 2025-01-01)"),
        @Parameter(name = "to", description = "조회 종료 날짜 (형식: yyyy-MM-dd, 예: 2025-12-31)")
    })
    @GetMapping
    public ApiResponse<BakeryTrendTagAdminListResponse> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to) {
        return ApiResponse.ok(
                trendService.findAllForAdmin(
                        from != null ? from.atStartOfDay() : null,
                        to != null ? to.atTime(LocalTime.MAX) : null,
                        PageRequest.of(page, size)));
    }
}

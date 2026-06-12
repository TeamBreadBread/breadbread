package com.breadbread.course.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.course.dto.request.ManualCourseRequest;
import com.breadbread.course.dto.request.UpdateCourseRequest;
import com.breadbread.course.dto.response.AiCourseAdminListResponse;
import com.breadbread.course.service.CourseService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.time.LocalTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "코스 - 관리자")
@RestController
@RequestMapping("/admin/courses")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminCourseController {

    private final CourseService courseService;

    @Operation(summary = "AI 코스 전체 목록 조회 (관리자)")
    @Parameters({
        @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
        @Parameter(name = "size", description = "페이지 크기 (기본값: 10)"),
        @Parameter(name = "from", description = "조회 시작 날짜 (형식: yyyy-MM-dd, 예: 2025-01-01)"),
        @Parameter(name = "to", description = "조회 종료 날짜 (형식: yyyy-MM-dd, 예: 2025-12-31)")
    })
    @GetMapping("/ai")
    public ApiResponse<AiCourseAdminListResponse> findAllAi(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
                    LocalDate to) {
        return ApiResponse.ok(
                courseService.findAllAiForAdmin(
                        from != null ? from.atStartOfDay() : null,
                        to != null ? to.atTime(LocalTime.MAX) : null,
                        PageRequest.of(page, size)));
    }

    @Operation(summary = "운영자 코스 등록")
    @PostMapping("/manual")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createManual(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ManualCourseRequest request) {
        return ApiResponse.ok(courseService.createManual(userDetails.getId(), request));
    }

    @Operation(summary = "운영자 코스 수정")
    @PatchMapping("/{id}/manual")
    public ApiResponse<Void> updateManual(
            @PathVariable Long id, @Valid @RequestBody UpdateCourseRequest request) {
        courseService.updateManual(id, request);
        return ApiResponse.ok();
    }

    @Operation(summary = "코스 삭제", description = "MANUAL/AI 코스 모두 삭제 가능")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        courseService.delete(id);
        return ApiResponse.ok();
    }
}

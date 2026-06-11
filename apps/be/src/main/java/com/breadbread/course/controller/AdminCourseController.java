package com.breadbread.course.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.course.dto.request.ManualCourseRequest;
import com.breadbread.course.dto.request.UpdateCourseRequest;
import com.breadbread.course.service.CourseService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

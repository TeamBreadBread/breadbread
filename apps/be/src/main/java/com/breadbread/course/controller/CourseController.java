package com.breadbread.course.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.course.dto.request.CourseSearch;
import com.breadbread.course.dto.request.ReorderBakeriesRequest;
import com.breadbread.course.dto.response.*;
import com.breadbread.course.service.CourseBakeryOrderService;
import com.breadbread.course.service.CourseDrivingRouteService;
import com.breadbread.course.service.CourseService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "코스")
@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final CourseDrivingRouteService courseDrivingRouteService;
    private final CourseBakeryOrderService courseBakeryOrderService;

    @Operation(summary = "코스 목록 조회", description = "지역별/종류별/테마별/에디터픽 필터 지원")
    @Parameters({
        @Parameter(name = "region", description = "지역 필터", example = "대전 중구"),
        @Parameter(name = "breadType", description = "빵 종류 필터"),
        @Parameter(name = "theme", description = "테마 필터"),
        @Parameter(name = "editorPick", description = "에디터픽 여부"),
        @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
        @Parameter(name = "size", description = "페이지 크기 (기본값: 10)")
    })
    @GetMapping
    public ApiResponse<CourseListResponse> search(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @ModelAttribute CourseSearch search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(courseService.search(search, PageRequest.of(page, size), userId));
    }

    @Operation(summary = "코스 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<CourseDetailResponse> findOne(
            @PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(courseService.findOne(id, userId));
    }

    @Operation(summary = "코스 좋아요", description = "이미 좋아요한 경우 409 반환")
    @PostMapping("/{id}/likes")
    public ApiResponse<Void> like(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.like(id, userDetails.getId());
        return ApiResponse.ok();
    }

    @Operation(summary = "코스 좋아요 취소", description = "좋아요하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/likes")
    public ApiResponse<Void> unlike(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.unlike(id, userDetails.getId());
        return ApiResponse.ok();
    }

    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "내 루트 목록 조회")
    @GetMapping("/me/routes")
    public ApiResponse<List<RouteResponse>> findMyRoutes(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(courseService.findMyRoutes(userDetails.getId()));
    }

    @Operation(summary = "코스 루트로 저장", description = "이미 저장한 경우 409 반환")
    @PostMapping("/{id}/routes")
    public ApiResponse<Void> saveRoute(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.saveRoute(id, userDetails.getId());
        return ApiResponse.ok();
    }

    @Operation(summary = "루트 저장 해제", description = "저장하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/routes")
    public ApiResponse<Void> removeRoute(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.removeRoute(id, userDetails.getId());
        return ApiResponse.ok();
    }

    @Operation(
            summary = "코스 자동차 경로 조회",
            description = "코스에 포함된 빵집 순서대로 자동차 주행 경로의 vertex 좌표를 반환합니다. 비공개 AI 코스는 본인만 조회할 수 있습니다.")
    @GetMapping("/{id}/directions")
    public ApiResponse<DrivingRouteResponse> getDrivingRoute(@PathVariable Long id) {
        return ApiResponse.ok(courseDrivingRouteService.getDrivingRoute(id));
    }

    @Operation(summary = "코스 내 빵집 방문 순서 변경")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PatchMapping("/{courseId}/bakeries/reorder")
    public ApiResponse<ReorderBakeriesResponse> reorderBakeries(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ReorderBakeriesRequest request) {
        return ApiResponse.ok(
                courseBakeryOrderService.reorderBakeries(
                        courseId, userDetails.getId(), userDetails.getRole(), request));
    }
}

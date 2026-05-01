package com.breadbread.course.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.entity.BreadType;
import com.breadbread.user.entity.UserRole;
import com.breadbread.course.dto.*;
import com.breadbread.course.service.CourseService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

import java.util.List;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "코스")
@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

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
            @RequestParam(required = false) String region,
            @RequestParam(required = false) BreadType breadType,
            @RequestParam(required = false) String theme,
            @RequestParam(required = false) Boolean editorPick,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        CourseSearch search = CourseSearch.builder()
                .region(region)
                .breadType(breadType)
                .theme(theme)
                .editorPick(editorPick)
                .build();

        Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(courseService.search(search, PageRequest.of(page, size), userId));
    }

    @Operation(summary = "코스 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<CourseDetailResponse> findOne(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        boolean isAdmin = userDetails != null && userDetails.getRole() == UserRole.ROLE_ADMIN;
        return ApiResponse.ok(courseService.findOne(id, userId, isAdmin));
    }

    @Operation(summary = "운영자 코스 등록")
    @PostMapping("/manual")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Long> createManual(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ManualCourseRequest request) {
        Long id = courseService.createManual(userDetails.getId(), request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "운영자 코스 수정")
    @PatchMapping("/{id}/manual")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> updateManual(
            @PathVariable Long id,
            @Valid @RequestBody UpdateCourseRequest request) {
        courseService.updateManual(id, request);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "코스 삭제 (관리자 전용)", description = "MANUAL/AI 코스 모두 삭제 가능")
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        courseService.delete(id);
        return ApiResponse.ok(null);
    }

    @Operation(summary = "AI 코스 추천 요청", description = "AI 서버 연동 후 구현 예정")
    @PostMapping("/ai")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<Long> createAi(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AiCourseRequest request) {
        Long id = courseService.createAi(userDetails.getId(), request);
        return ApiResponse.ok(id);
    }

    @Operation(summary = "AI 코스 삭제 (본인 코스만 가능)")
    @DeleteMapping("/{id}/ai")
    public ApiResponse<Void> deleteAi(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        courseService.deleteAi(id, userDetails.getId());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "코스 좋아요", description = "이미 좋아요한 경우 409 반환")
    @PostMapping("/{id}/likes")
    public ApiResponse<Void> like(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        courseService.like(id, userDetails.getId());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "코스 좋아요 취소", description = "좋아요하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/likes")
    public ApiResponse<Void> unlike(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        courseService.unlike(id, userDetails.getId());
        return ApiResponse.ok(null);
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
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        courseService.saveRoute(id, userDetails.getId());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "루트 저장 해제", description = "저장하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/routes")
    public ApiResponse<Void> removeRoute(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        courseService.removeRoute(id, userDetails.getId());
        return ApiResponse.ok(null);
    }
}

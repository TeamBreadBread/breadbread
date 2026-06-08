package com.breadbread.course.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.bakery.entity.BreadType;
import com.breadbread.course.dto.*;
import com.breadbread.course.dto.ai.AiCoursePreviewResponse;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
import com.breadbread.course.service.CourseService;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.user.entity.UserRole;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
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

        CourseSearch search =
                CourseSearch.builder()
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
            @PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        UserRole role = userDetails != null ? userDetails.getRole() : null;
        return ApiResponse.ok(courseService.findOne(id, userId, role));
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
            @PathVariable Long id, @Valid @RequestBody UpdateCourseRequest request) {
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

    @Operation(
            summary = "AI 코스 추천 요청",
            description = "비동기로 처리되며 jobId를 즉시 반환합니다. GET /courses/ai/status/{jobId}로 결과를 폴링하세요.")
    @PostMapping("/ai")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> createAi(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AiCourseRequest request) {
        String jobId = courseService.createAi(userDetails.getId(), request);
        return ApiResponse.ok(jobId);
    }

    @Operation(
            summary = "AI 코스 추천 상태 조회",
            description =
                    "status: PENDING | COMPLETED | FAILED. COMPLETED 시 GET /courses/ai/{jobId}/preview로 결과를 확인한 뒤 POST /courses/ai/{jobId}/save로 저장하세요.")
    @GetMapping("/ai/status/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AiJobStatusResponse> getAiJobStatus(
            @PathVariable String jobId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(courseService.getAiJobStatus(jobId, userDetails.getId()));
    }

    @Operation(
            summary = "AI 코스 추천 결과 미리보기",
            description = "추천 완료 후 저장 전에 결과를 확인합니다. 24시간 내에 저장하지 않으면 결과가 만료됩니다.")
    @GetMapping("/ai/{jobId}/preview")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AiCoursePreviewResponse> getAiPreview(
            @PathVariable String jobId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(courseService.getAiPreview(jobId, userDetails.getId()));
    }

    @Operation(
            summary = "AI 코스 저장",
            description = "미리보기 확인 후 코스를 내 목록에 저장합니다. 저장 후 Redis 임시 데이터는 삭제됩니다.")
    @PostMapping("/ai/{jobId}/save")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Long> saveAiCourse(
            @PathVariable String jobId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(courseService.saveAiCourse(jobId, userDetails.getId()));
    }

    @Operation(summary = "AI 코스 삭제 (본인 코스만 가능)")
    @DeleteMapping("/{id}/ai")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteAi(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.deleteAi(id, userDetails.getId());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "코스 좋아요", description = "이미 좋아요한 경우 409 반환")
    @PostMapping("/{id}/likes")
    public ApiResponse<Void> like(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.like(id, userDetails.getId());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "코스 좋아요 취소", description = "좋아요하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/likes")
    public ApiResponse<Void> unlike(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
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
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.saveRoute(id, userDetails.getId());
        return ApiResponse.ok(null);
    }

    @Operation(summary = "루트 저장 해제", description = "저장하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/routes")
    public ApiResponse<Void> removeRoute(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        courseService.removeRoute(id, userDetails.getId());
        return ApiResponse.ok(null);
    }

    @Operation(
            summary = "코스 자동차 경로 조회",
            description =
                    "코스에 포함된 빵집 순서대로 자동차 주행 경로의 vertex 좌표를 반환합니다." + " 비공개 AI 코스는 본인만 조회할 수 있습니다.")
    @GetMapping("/{id}/directions")
    public ApiResponse<DrivingRouteResponse> getDrivingRoute(
            @PathVariable Long id, @AuthenticationPrincipal CustomUserDetails userDetails) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        UserRole role = userDetails != null ? userDetails.getRole() : null;
        return ApiResponse.ok(courseService.getDrivingRoute(id, userId, role));
    }

    @Operation(summary = "코스 내 빵집 방문 순서 변경")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    @PatchMapping("/{courseId}/bakeries/reorder")
    public ApiResponse<ReorderBakeriesResponse> reorderBakeries(
            @PathVariable Long courseId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ReorderBakeriesRequest request) {
        return ApiResponse.ok(
                courseService.reorderBakeries(
                        courseId, userDetails.getId(), userDetails.getRole(), request));
    }
}

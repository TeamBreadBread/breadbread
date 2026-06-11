package com.breadbread.course.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.course.dto.ai.AiCoursePreviewResponse;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
import com.breadbread.course.dto.request.ReorderBakeriesRequest;
import com.breadbread.course.service.AiCourseSaveService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "코스 - AI")
@RestController
@RequestMapping("/courses")
@RequiredArgsConstructor
public class AiCourseController {

    private final AiCourseSaveService aiCourseSaveService;

    @Operation(
            summary = "AI 코스 추천 요청",
            description = "비동기로 처리되며 jobId를 즉시 반환합니다. GET /courses/ai/status/{jobId}로 결과를 폴링하세요.")
    @PostMapping("/ai")
    @ResponseStatus(HttpStatus.ACCEPTED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> createAi(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AiCourseRequest request) {
        return ApiResponse.ok(aiCourseSaveService.createAi(userDetails.getId(), request));
    }

    @Operation(
            summary = "AI 코스 추천 상태 조회",
            description =
                    "status: PENDING | COMPLETED | FAILED. COMPLETED 시 GET /courses/ai/{jobId}/preview로 결과를 확인한 뒤 POST /courses/ai/{jobId}/save로 저장하세요.")
    @GetMapping("/ai/status/{jobId}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AiJobStatusResponse> getAiJobStatus(
            @PathVariable String jobId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(aiCourseSaveService.getAiJobStatus(jobId, userDetails.getId()));
    }

    @Operation(
            summary = "AI 코스 추천 결과 미리보기",
            description = "추천 완료 후 저장 전에 결과를 확인합니다. 24시간 내에 저장하지 않으면 결과가 만료됩니다.")
    @GetMapping("/ai/{jobId}/preview")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<AiCoursePreviewResponse> getAiPreview(
            @PathVariable String jobId, @AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.ok(aiCourseSaveService.getAiPreview(jobId, userDetails.getId()));
    }

    @Operation(
            summary = "AI 코스 저장",
            description =
                    "미리보기 확인 후 코스를 내 목록에 저장합니다. 저장 후 Redis 임시 데이터는 삭제됩니다."
                            + " bakeryOrder 미전달 시 AI 추천 순서 그대로 저장됩니다.")
    @PostMapping("/ai/{jobId}/save")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Long> saveAiCourse(
            @PathVariable String jobId,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody(required = false) ReorderBakeriesRequest reorderRequest) {
        List<Long> bakeryOrder = reorderRequest != null ? reorderRequest.getBakeryOrder() : null;
        return ApiResponse.ok(
                aiCourseSaveService.saveAiCourse(jobId, userDetails.getId(), bakeryOrder));
    }

    @Operation(summary = "AI 코스 삭제 (본인 코스만 가능)")
    @DeleteMapping("/{id}/ai")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteAi(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        aiCourseSaveService.deleteAi(id, userDetails.getId());
        return ApiResponse.ok();
    }
}

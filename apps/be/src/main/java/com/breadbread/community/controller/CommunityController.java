package com.breadbread.community.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.community.dto.CommentResponse;
import com.breadbread.community.dto.CreateCommentRequest;
import com.breadbread.community.dto.CreatePostRequest;
import com.breadbread.community.dto.PostDetailResponse;
import com.breadbread.community.dto.PostListResponse;
import com.breadbread.community.dto.PostListSort;
import com.breadbread.community.dto.UpdateCommentRequest;
import com.breadbread.community.dto.UpdatePostRequest;
import com.breadbread.community.entity.PostType;
import com.breadbread.community.service.CommunityService;
import com.breadbread.global.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.Parameters;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "빵터")
@RestController
@RequestMapping("/posts")
@RequiredArgsConstructor
public class CommunityController {

    private final CommunityService communityService;

    @Operation(summary = "게시글 목록 조회", description = "postType 복수 전달 가능. 미전달 시 전체 조회")
    @Parameters({
        @Parameter(
                name = "postTypes",
                description = "게시글 유형 필터 (FREE: 자유게시판, NOTICE+ARTICLE: 빵티클)",
                example = "FREE"),
        @Parameter(name = "keyword", description = "제목 또는 내용 검색어", example = "성심당"),
        @Parameter(name = "page", description = "페이지 번호 (0부터 시작, 기본값: 0)"),
        @Parameter(name = "size", description = "페이지 크기 (기본값: 10)"),
        @Parameter(
                name = "sort",
                description = "정렬: LATEST(작성일 최신순, 기본값), LIKE_COUNT(좋아요 많은 순)",
                example = "LATEST")
    })
    @GetMapping
    public ApiResponse<PostListResponse> findAll(
            @RequestParam(required = false) List<PostType> postTypes,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "LATEST") String sort) {
        return ApiResponse.ok(
                communityService.findAll(
                        postTypes, keyword, page, size, PostListSort.fromParam(sort)));
    }

    @Operation(summary = "게시글 작성", description = "NOTICE·ARTICLE 유형은 관리자만 작성 가능")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public ApiResponse<Long> create(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreatePostRequest request) {
        return ApiResponse.ok(
                communityService.createPost(userDetails.getId(), userDetails.getRole(), request));
    }

    @Operation(summary = "게시글 상세 조회")
    @GetMapping("/{id}")
    public ApiResponse<PostDetailResponse> findOne(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        Long userId = userDetails != null ? userDetails.getId() : null;
        return ApiResponse.ok(communityService.findOne(id, userId));
    }

    @Operation(summary = "게시글 수정", description = "본인 작성 게시글 또는 관리자만 수정 가능")
    @PatchMapping("/{id}")
    public ApiResponse<Void> update(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody UpdatePostRequest request) {
        communityService.updatePost(id, userDetails.getId(), userDetails.getRole(), request);
        return ApiResponse.ok();
    }

    @Operation(summary = "게시글 삭제", description = "본인 작성 게시글 또는 관리자만 삭제 가능")
    @DeleteMapping("/{id}")
    public ApiResponse<Void> remove(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        communityService.removePost(id, userDetails.getId(), userDetails.getRole());
        return ApiResponse.ok();
    }

    @Operation(summary = "댓글 작성")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/{id}/comments")
    public ApiResponse<CommentResponse> createComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CreateCommentRequest request) {
        return ApiResponse.ok(communityService.createComment(id, userDetails.getId(), request));
    }

    @Operation(summary = "댓글 수정", description = "본인 작성 댓글 또는 관리자만 수정 가능")
    @PatchMapping("/{id}/comments/{commentId}")
    public ApiResponse<Void> updateComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long commentId,
            @Valid @RequestBody UpdateCommentRequest request) {
        communityService.updateComment(
                id, commentId, userDetails.getId(), userDetails.getRole(), request);
        return ApiResponse.ok();
    }

    @Operation(summary = "댓글 삭제", description = "본인 작성 댓글 또는 관리자만 삭제 가능")
    @DeleteMapping("/{id}/comments/{commentId}")
    public ApiResponse<Void> removeComment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @PathVariable Long commentId) {
        communityService.removeComment(id, commentId, userDetails.getId(), userDetails.getRole());
        return ApiResponse.ok();
    }

    @Operation(summary = "게시글 좋아요", description = "이미 좋아요한 경우 409 반환")
    @PostMapping("/{id}/likes")
    public ApiResponse<Void> likePost(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        communityService.likePost(id, userDetails.getId());
        return ApiResponse.ok();
    }

    @Operation(summary = "게시글 좋아요 취소", description = "좋아요하지 않은 경우 400 반환")
    @DeleteMapping("/{id}/likes")
    public ApiResponse<Void> unlikePost(
            @AuthenticationPrincipal CustomUserDetails userDetails, @PathVariable Long id) {
        communityService.unlikePost(id, userDetails.getId());
        return ApiResponse.ok();
    }
}

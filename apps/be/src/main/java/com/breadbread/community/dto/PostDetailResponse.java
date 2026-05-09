package com.breadbread.community.dto;

import com.breadbread.community.entity.Post;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "게시글 상세 응답")
@Getter
@Builder
public class PostDetailResponse {

    @Schema(description = "게시글 ID", example = "1")
    private Long id;

    @Schema(description = "제목", example = "방금 먹은 빵집 진짜 대박")
    private String title;

    @Schema(description = "작성자 닉네임", example = "빵순이")
    private String nickname;

    @Schema(description = "작성자 프로필 이미지 URL")
    private String profileImageUrl;

    @Schema(description = "작성 시각", example = "2026-04-27T00:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "본문 내용")
    private String content;

    @Schema(description = "이미지 URL 목록")
    private List<String> imageUrls;

    @Schema(description = "현재 사용자의 좋아요 여부", example = "false")
    private boolean liked;

    @Schema(description = "현재 사용자가 작성자 여부", example = "false")
    private boolean isAuthor;

    @Schema(description = "좋아요 수", example = "11")
    private int likeCount;

    @Schema(description = "댓글 목록")
    private CommentListResponse commentListResponse;

    public static PostDetailResponse from(
            Post post,
            Long userId,
            boolean liked,
            int likeCount,
            CommentListResponse commentListResponse) {
        return PostDetailResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .nickname(post.getUser().getNickname())
                .profileImageUrl(post.getUser().getProfileImageUrl())
                .createdAt(post.getCreatedAt())
                .content(post.getContent())
                .imageUrls(new ArrayList<>(post.getImageUrls()))
                .liked(liked)
                .isAuthor(userId != null && userId.equals(post.getUser().getId()))
                .likeCount(likeCount)
                .commentListResponse(commentListResponse)
                .build();
    }
}

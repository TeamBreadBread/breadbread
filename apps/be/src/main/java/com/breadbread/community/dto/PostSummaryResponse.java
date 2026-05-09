package com.breadbread.community.dto;

import com.breadbread.community.entity.Post;
import com.breadbread.community.entity.PostType;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "게시글 목록 항목")
@Getter
@Builder
public class PostSummaryResponse {

    @Schema(description = "게시글 ID", example = "1")
    private Long id;

    @Schema(description = "제목", example = "방금 먹은 빵집 진짜 대박")
    private String title;

    @Schema(description = "게시글 유형", example = "FREE")
    private PostType postType;

    @Schema(description = "좋아요 수", example = "11")
    private int likeCount;

    @Schema(description = "댓글 수", example = "11")
    private int commentCount;

    @Schema(description = "썸네일 이미지 URL (이미지 없으면 null)")
    private String thumbnailImageUrl;

    @Schema(description = "작성 시각", example = "2026-04-27T00:00:00")
    private LocalDateTime createdAt;

    public static PostSummaryResponse from(Post post, int likeCount, int commentCount) {
        return PostSummaryResponse.builder()
                .id(post.getId())
                .title(post.getTitle())
                .postType(post.getPostType())
                .likeCount(likeCount)
                .commentCount(commentCount)
                .thumbnailImageUrl(
                        post.getImageUrls().isEmpty() ? null : post.getImageUrls().get(0))
                .createdAt(post.getCreatedAt())
                .build();
    }
}

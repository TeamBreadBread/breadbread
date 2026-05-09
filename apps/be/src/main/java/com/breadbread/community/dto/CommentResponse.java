package com.breadbread.community.dto;

import com.breadbread.community.entity.Comment;
import io.swagger.v3.oas.annotations.media.Schema;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "댓글 응답")
@Getter
@Builder
public class CommentResponse {

    @Schema(description = "댓글 ID", example = "1")
    private Long id;

    @Schema(description = "작성자 닉네임", example = "빵순이")
    private String nickname;

    @Schema(description = "작성자 프로필 이미지 URL")
    private String profileImageUrl;

    @Schema(description = "댓글 내용", example = "저도 거기 가봤는데 진짜 맛있더라고요!")
    private String content;

    @Schema(description = "작성 시각", example = "2026-04-27T00:00:00")
    private LocalDateTime createdAt;

    @Schema(description = "현재 사용자가 작성자 여부", example = "false")
    private boolean isAuthor;

    public static CommentResponse from(Comment comment, Long userId) {
        return CommentResponse.builder()
                .id(comment.getId())
                .nickname(comment.getUser().getNickname())
                .profileImageUrl(comment.getUser().getProfileImageUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt())
                .isAuthor(userId != null && userId.equals(comment.getUser().getId()))
                .build();
    }
}

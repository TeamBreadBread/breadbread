package com.breadbread.community.dto;

import com.breadbread.community.entity.Comment;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Schema(description = "댓글 목록 응답")
@Getter
@Builder
public class CommentListResponse {

    @Schema(description = "댓글 목록")
    private List<CommentResponse> comments;

    @Schema(description = "전체 댓글 수", example = "11")
    private int total;

    public static CommentListResponse from(List<Comment> comments, Long userId) {
        List<CommentResponse> responses =
                comments.stream().map(c -> CommentResponse.from(c, userId)).toList();
        return CommentListResponse.builder().comments(responses).total(responses.size()).build();
    }
}

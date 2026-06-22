package com.breadbread.community.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "댓글 수정 요청")
@Getter
@NoArgsConstructor
public class UpdateCommentRequest {

    @Schema(description = "수정할 댓글 내용", example = "수정된 댓글입니다.")
    @NotBlank
    @Size(max = 1000)
    private String content;

    @Schema(description = "이미지 URL 목록 (최대 3개, null이면 변경 없음)")
    @Size(max = 3)
    private List<String> imageUrls;
}

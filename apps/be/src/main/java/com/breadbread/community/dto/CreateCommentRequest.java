package com.breadbread.community.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "댓글 작성 요청")
@Getter
@NoArgsConstructor
public class CreateCommentRequest {

    @Schema(description = "댓글 내용", example = "저도 거기 가봤는데 진짜 맛있더라고요!")
    @NotBlank
    @Size(max = 1000)
    private String content;
}

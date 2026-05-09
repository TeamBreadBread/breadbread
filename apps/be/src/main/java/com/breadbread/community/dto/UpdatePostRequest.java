package com.breadbread.community.dto;

import com.breadbread.global.validation.NotBlankIfPresent;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "게시글 수정 요청 (변경할 필드만 포함)")
@Getter
@NoArgsConstructor
public class UpdatePostRequest {

    @Schema(description = "수정할 제목", example = "방금 먹은 빵집 진짜 대박 지금까지 이런 맛은 없었다")
    @NotBlankIfPresent
    @Size(max = 100)
    private String title;

    @Schema(description = "수정할 본문 내용")
    @NotBlankIfPresent
    @Size(max = 5000)
    private String content;

    @Schema(description = "수정할 이미지 URL 목록 (최대 5개, null 전송 시 변경 없음)")
    @Size(max = 5)
    private List<String> imageUrls;
}

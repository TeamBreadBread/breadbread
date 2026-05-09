package com.breadbread.community.dto;

import com.breadbread.community.entity.PostType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Schema(description = "게시글 작성 요청")
@Getter
@NoArgsConstructor
public class CreatePostRequest {

    @Schema(description = "제목", example = "방금 먹은 빵집 진짜 대박")
    @NotBlank
    @Size(max = 100)
    private String title;

    @Schema(description = "본문 내용", example = "연남동 근처에 카공하기 좋은 베이커리...")
    @NotBlank
    @Size(max = 5000)
    private String content;

    @Schema(description = "게시글 유형 (FREE: 자유게시판, NOTICE: 공지, ARTICLE: 빵티클)", example = "FREE")
    @NotNull
    private PostType postType;

    @Schema(description = "이미지 URL 목록 (최대 5개)")
    @Size(max = 5)
    private List<String> imageUrls;
}

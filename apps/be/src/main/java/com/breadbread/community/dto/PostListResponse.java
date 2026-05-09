package com.breadbread.community.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Builder;
import lombok.Getter;
import org.springframework.data.domain.Page;

@Schema(description = "게시글 목록 응답")
@Getter
@Builder
public class PostListResponse {

    @Schema(description = "게시글 목록")
    private List<PostSummaryResponse> posts;

    @Schema(description = "전체 게시글 수", example = "42")
    private int total;

    @Schema(description = "현재 페이지 번호 (0부터 시작)", example = "0")
    private int page;

    @Schema(description = "페이지 크기", example = "10")
    private int size;

    @Schema(description = "다음 페이지 존재 여부", example = "true")
    private boolean hasNext;

    public static PostListResponse from(Page<?> page, List<PostSummaryResponse> posts) {
        return PostListResponse.builder()
                .posts(posts)
                .total((int) page.getTotalElements())
                .page(page.getNumber())
                .size(page.getSize())
                .hasNext(page.hasNext())
                .build();
    }
}

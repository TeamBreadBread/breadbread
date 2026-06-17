package com.breadbread.bakery.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ApproveBakeriesResponse {
    @Schema(description = "승인 성공 건수", example = "2")
    private int successCount;

    @Schema(description = "스킵 건수 (필수 항목 미충족 또는 PENDING이 아닌 경우)", example = "1")
    private int skipCount;

    @Schema(description = "스킵된 빵집 목록")
    private List<SkippedBakery> skippedBakeries;

    @Getter
    @Builder
    public static class SkippedBakery {
        @Schema(description = "빵집 ID", example = "3")
        private Long id;

        @Schema(description = "빵집 이름", example = "맛있는빵집")
        private String name;
    }
}

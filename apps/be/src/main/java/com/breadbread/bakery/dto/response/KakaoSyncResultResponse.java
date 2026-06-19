package com.breadbread.bakery.dto.response;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class KakaoSyncResultResponse {
    @Schema(description = "업데이트 성공 건수", example = "8")
    private int successCount;

    @Schema(description = "매칭 실패 건수", example = "3")
    private int skippedCount;

    @Schema(description = "예외 발생으로 실패한 건수", example = "1")
    private int failedCount;

    @Schema(description = "매칭 실패한 빵집 목록")
    private List<BakeryEntry> skippedBakeries;

    @Schema(description = "예외 발생으로 실패한 빵집 목록")
    private List<BakeryEntry> failedBakeries;

    @Getter
    @Builder
    public static class BakeryEntry {
        @Schema(description = "빵집 ID", example = "3")
        private Long id;

        @Schema(description = "빵집 이름", example = "맛있는빵집")
        private String name;
    }
}

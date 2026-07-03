package com.breadbread.bakery.dto.response;

import com.breadbread.bakery.dto.imports.BakeryImportCandidate;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryImportPreviewResponse {
    @Schema(description = "확정 저장 시 사용할 검색 ID", example = "3f1b2c4e-...")
    private String searchId;

    @Schema(description = "검색에 사용한 키워드", example = "대전 빵집")
    private String keyword;

    @Schema(description = "검색된 후보 목록 (아직 DB에 저장되지 않음)")
    private List<BakeryImportCandidate> candidates;
}

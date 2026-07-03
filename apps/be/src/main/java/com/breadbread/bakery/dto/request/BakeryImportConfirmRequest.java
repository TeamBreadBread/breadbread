package com.breadbread.bakery.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class BakeryImportConfirmRequest {
    @Schema(description = "검색 미리보기에서 발급받은 검색 ID")
    @NotBlank
    private String searchId;

    @Schema(description = "저장할 후보의 externalId 목록 (미리보기 응답의 candidates[].externalId)")
    @NotEmpty
    private List<@NotBlank String> candidateIds;
}

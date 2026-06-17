package com.breadbread.bakery.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ApproveBakeriesRequest {
    @Schema(description = "승인할 빵집 ID 목록 (null 원소 불가)", example = "[1, 2, 3]")
    @NotEmpty
    private List<@NotNull Long> ids;
}

package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CheckIdResponse {
    @Schema(description = "아이디 사용 가능 여부 (true: 사용 가능, false: 이미 사용 중)", example = "true")
    private boolean available;
}

package com.breadbread.auth.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class FindIdResponse {
    @Schema(description = "찾은 로그인 아이디", example = "breaduser123")
    private String loginId;
}

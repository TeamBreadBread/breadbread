package com.breadbread.auth.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
public class FindIdResponse {
    private String loginId;
}

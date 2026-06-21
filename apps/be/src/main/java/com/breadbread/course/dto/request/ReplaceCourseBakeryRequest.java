package com.breadbread.course.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class ReplaceCourseBakeryRequest {
    /** 생략 시 유사·영업 중 빵집을 서버에서 추천합니다. */
    private Long replacementBakeryId;
}

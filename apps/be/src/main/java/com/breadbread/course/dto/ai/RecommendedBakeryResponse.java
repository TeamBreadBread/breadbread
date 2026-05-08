package com.breadbread.course.dto.ai;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class RecommendedBakeryResponse {
    private Long id;
    private int order;
    private String name;
    private String recommendedBread;
    private String reason;
}

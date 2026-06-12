package com.breadbread.course.dto.ai;

import com.breadbread.course.entity.CourseBakery;
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

    public static RecommendedBakeryResponse from(CourseBakery cb) {
        RecommendedBakeryResponse r = new RecommendedBakeryResponse();
        r.id = cb.getBakery().getId();
        r.order = cb.getVisitOrder();
        r.name = cb.getBakery().getName();
        r.recommendedBread = cb.getRecommendedBread();
        r.reason = cb.getReason();
        return r;
    }
}

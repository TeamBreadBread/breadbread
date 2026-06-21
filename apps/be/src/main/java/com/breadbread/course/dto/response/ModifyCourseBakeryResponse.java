package com.breadbread.course.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ModifyCourseBakeryResponse {

    private Long courseId;
    private List<Long> bakeryOrder;
    private int estimatedTotalMinutes;
    private Long targetBakeryId;
    private String targetBakeryName;
    private Long replacementBakeryId;
    private String replacementBakeryName;
}

package com.breadbread.course.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReorderBakeriesResponse {

    private Long courseId;

    private List<Long> bakeryOrder;

    private int estimatedTotalMinutes;
}

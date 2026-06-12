package com.breadbread.trend.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryTrendTagAdminListResponse {
    private List<BakeryTrendTagAdminResponse> tags;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

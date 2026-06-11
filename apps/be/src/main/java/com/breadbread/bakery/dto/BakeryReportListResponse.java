package com.breadbread.bakery.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryReportListResponse {
    private List<BakeryReportResponse> reports;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

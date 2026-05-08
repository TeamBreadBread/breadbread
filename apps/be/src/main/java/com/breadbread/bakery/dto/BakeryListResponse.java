package com.breadbread.bakery.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryListResponse {
    private List<BakerySummaryResponse> bakeries;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

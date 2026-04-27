package com.breadbread.bakery.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class BakeryListResponse {
    private List<BakerySummaryResponse> bakeries;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

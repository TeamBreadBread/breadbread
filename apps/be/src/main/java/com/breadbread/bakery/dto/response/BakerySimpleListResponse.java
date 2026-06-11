package com.breadbread.bakery.dto.response;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakerySimpleListResponse {
    private List<BakerySummarySimpleResponse> bakeries;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

package com.breadbread.bakery.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MyReviewListResponse {
    private List<MyReviewResponse> reviews;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

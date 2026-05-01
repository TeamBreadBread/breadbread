package com.breadbread.bakery.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ReviewListResponse {
    private List<ReviewResponse> reviews;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

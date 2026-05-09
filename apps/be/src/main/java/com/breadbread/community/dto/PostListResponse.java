package com.breadbread.community.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostListResponse {
    private List<PostSummaryResponse> posts;
    private int total;
    private int page;
    private int size;
    private boolean hasNext;
}

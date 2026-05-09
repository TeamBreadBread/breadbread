package com.breadbread.community.dto;

import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommentListResponse {
    private List<CommentResponse> comments;
    private int total;
}

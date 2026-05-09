package com.breadbread.community.dto;

import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostDetailResponse {
    private Long id;
    private String title;
    private String nickname;
    private String profileImageUrl;
    private LocalDateTime createdAt;
    private String content;
    private List<String> imageUrls;
    private boolean liked;
    private int likeCount;
    private CommentListResponse commentListResponse;
}

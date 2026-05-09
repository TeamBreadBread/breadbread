package com.breadbread.community.dto;

import com.breadbread.community.entity.PostType;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostSummaryResponse {
    private Long id;
    private String title;
    private PostType postType;
    private int likeCount;
    private int commentCount;
    private String thumbnailImageUrl;
    private LocalDateTime createdAt;
}

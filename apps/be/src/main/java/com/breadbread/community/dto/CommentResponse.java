package com.breadbread.community.dto;

import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CommentResponse {
    private Long id;
    private String nickname;
    private String profileImageUrl;
    private String content;
    private LocalDateTime createdAt;
}

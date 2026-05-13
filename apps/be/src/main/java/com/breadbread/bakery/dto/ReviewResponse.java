package com.breadbread.bakery.dto;

import com.breadbread.bakery.entity.Review;
import com.breadbread.user.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ReviewResponse {
    private Long id;

    /** 후기 작성자 회원 ID — 클라이언트에서 '내 후기' 표시명 교정용 */
    private Long authorUserId;

    private String authorNickname;
    private int rating;
    private String content;
    private List<String> imageUrls;
    private LocalDateTime createdAt;
    private boolean isAuthor;

    public static ReviewResponse from(Review review, Long currentUserId) {
        boolean isAuthor =
                currentUserId != null
                        && review.getUser() != null
                        && review.getUser().getId().equals(currentUserId);
        return ReviewResponse.builder()
                .id(review.getId())
                .authorUserId(review.getUser() != null ? review.getUser().getId() : null)
                .authorNickname(authorDisplayName(review.getUser()))
                .rating(review.getRating())
                .content(review.getContent())
                .imageUrls(review.getImageUrls())
                .createdAt(review.getCreatedAt())
                .isAuthor(isAuthor)
                .build();
    }

    /**
     * 마이페이지와 동일한 식별감부: 회원 이름 → 로그인 아이디 → 내부 자동 생성 닉네임(바삭한스콘7810 형태). 가입 시 {@code nickname}만 자동 부여되는
     * 경우 로그인 아이디보다 우선 노출하면 안 됨.
     */
    private static String authorDisplayName(User user) {
        if (user == null) {
            return null;
        }
        if (user.getName() != null && !user.getName().isBlank()) {
            return user.getName().trim();
        }
        if (user.getLoginId() != null && !user.getLoginId().isBlank()) {
            return user.getLoginId().trim();
        }
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname().trim();
        }
        return null;
    }
}

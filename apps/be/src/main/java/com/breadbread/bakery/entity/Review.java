package com.breadbread.bakery.entity;

import com.breadbread.global.entity.BaseEntity;
import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.*;

@Entity
@Table
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = "bakery")
public class Review extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "text")
    private String content;

    @Min(1)
    @Max(5)
    private int rating;

    private String imageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    @Builder
    public Review(String content, int rating, String imageUrl, User user, Bakery bakery) {
        this.content = content;
        this.rating = rating;
        this.imageUrl = imageUrl;
        this.user = user;
        this.bakery = bakery;
    }
}

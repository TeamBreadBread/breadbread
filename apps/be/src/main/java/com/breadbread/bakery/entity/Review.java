package com.breadbread.bakery.entity;

import com.breadbread.bakery.dto.UpdateReviewRequest;
import com.breadbread.global.entity.BaseEntity;
import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Table
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"bakery", "user"})
public class Review extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Size(max = 300)
    @Column(length = 300)
    private String content;

    @Min(1)
    @Max(5)
    private int rating;

    @ElementCollection
    @CollectionTable(name = "review_image", joinColumns = @JoinColumn(name = "review_id"))
    @Column(name = "image_url")
    @Size(max = 2)
    private List<String> imageUrls = new ArrayList<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    public void update(UpdateReviewRequest request) {
        if (request.getRating() != null) this.rating = request.getRating();
        if (request.getContent() != null) this.content = request.getContent();
        if (request.getImageUrls() != null) this.imageUrls = request.getImageUrls();
    }

    @Builder
    public Review(String content, int rating, List<String> imageUrls, User user, Bakery bakery) {
        this.content = content;
        this.rating = rating;
        this.imageUrls = imageUrls != null ? imageUrls : new ArrayList<>();
        this.user = user;
        this.bakery = bakery;
    }
}

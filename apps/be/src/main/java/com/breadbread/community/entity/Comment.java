package com.breadbread.community.entity;

import com.breadbread.global.entity.BaseEntity;
import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Table
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"post", "user"})
public class Comment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "text", nullable = false)
    private String content;

    @ElementCollection
    @CollectionTable(name = "comment_image_urls", joinColumns = @JoinColumn(name = "comment_id"))
    @Column(name = "image_url", nullable = false)
    private List<String> imageUrls = new ArrayList<>();

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Builder
    public Comment(String content, List<String> imageUrls, Post post, User user) {
        this.content = content;
        this.imageUrls = imageUrls != null ? new ArrayList<>(imageUrls) : new ArrayList<>();
        this.post = post;
        this.user = user;
    }

    public void update(String content, List<String> imageUrls) {
        if (content != null) {
            this.content = content;
        }
        if (imageUrls != null) {
            this.imageUrls = new ArrayList<>(imageUrls);
        }
    }

    public void deactivate() {
        this.active = false;
    }
}

package com.breadbread.bakery.entity;

import com.breadbread.bakery.entity.enums.BreadTagType;
import com.breadbread.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bread_tag")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BreadTag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bread_id", nullable = false)
    private Bread bread;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BreadTagType tag;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "review_id", nullable = false)
    private Review review;

    @Builder
    public BreadTag(Bread bread, BreadTagType tag, Review review) {
        this.bread = bread;
        this.tag = tag;
        this.review = review;
    }
}

package com.breadbread.bakery.entity;

import com.breadbread.bakery.entity.enums.BakeryTagType;
import com.breadbread.global.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bakery_tag")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BakeryTag extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id", nullable = false)
    private Bakery bakery;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BakeryTagType tag;

    @Column(nullable = false)
    private String sourceType; // POST or REVIEW

    @Column(nullable = false)
    private Long sourceId;

    @Builder
    public BakeryTag(Bakery bakery, BakeryTagType tag, String sourceType, Long sourceId) {
        this.bakery = bakery;
        this.tag = tag;
        this.sourceType = sourceType;
        this.sourceId = sourceId;
    }
}

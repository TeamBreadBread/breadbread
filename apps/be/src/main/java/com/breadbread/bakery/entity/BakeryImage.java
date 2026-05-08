package com.breadbread.bakery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = "bakery")
public class BakeryImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String imageUrl;

    private int displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    // Builder 객체를 로그로 찍을 때 bakery 전체가 붙어서 출력되거나 순환 참조되므로 주의 필요
    @Builder
    public BakeryImage(String imageUrl, int displayOrder, Bakery bakery) {
        this.imageUrl = imageUrl;
        this.displayOrder = displayOrder;
        this.bakery = bakery;
    }
}

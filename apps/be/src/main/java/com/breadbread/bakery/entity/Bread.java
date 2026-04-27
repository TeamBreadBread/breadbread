package com.breadbread.bakery.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = "bakery")
public class Bread {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private int price;
    private String imageUrl;
    private boolean signature;
    private int selloutMin;

    private boolean estimatedSoldOut = false;

    @Enumerated(EnumType.STRING)
    private BreadType breadType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    // Builder 객체를 로그로 찍을 때 bakery 전체가 붙어서 출력되거나 순환 참조되므로 주의 필요
    @Builder
    public Bread(String name, int price, String imageUrl,
                 Bakery bakery, BreadType breadType,
                 boolean signature, int selloutMin) {
        this.name = name;
        this.price = price;
        this.imageUrl = imageUrl;
        this.bakery = bakery;
        this.breadType = breadType;
        this.signature = signature;
        this.selloutMin = selloutMin;
    }

    public void update(String name, Integer price, String imageUrl,
                       BreadType breadType, Boolean signature) {
        if (name != null) this.name = name;
        if (price != null) this.price = price;
        if (imageUrl != null) this.imageUrl = imageUrl;
        if (breadType != null) this.breadType = breadType;
        if (signature != null) this.signature = signature;
    }

    public void markSoldOut() {
        this.estimatedSoldOut = true;
    }

    public void markAvailable() {
        this.estimatedSoldOut = false;
    }
}

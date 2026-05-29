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

    // imageUrl과 둘 중 하나만 설정. photoName은 만료되므로 저장하지 않고 런타임에 획득.
    private String placeId;

    private int displayOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    // Builder 객체를 로그로 찍을 때 bakery 전체가 붙어서 출력되거나 순환 참조되므로 주의 필요
    @Builder
    public BakeryImage(String imageUrl, String placeId, int displayOrder, Bakery bakery) {
        this.imageUrl = imageUrl;
        this.placeId = placeId;
        this.displayOrder = displayOrder;
        this.bakery = bakery;
    }
}

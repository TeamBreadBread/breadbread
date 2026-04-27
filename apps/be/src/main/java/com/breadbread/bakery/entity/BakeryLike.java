package com.breadbread.bakery.entity;

import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"bakery_id", "user_id"})})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"bakery", "user"})
public class BakeryLike {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // Builder 객체를 로그로 찍을 때 bakery 전체가 붙어서 출력되거나 순환 참조되므로 주의 필요
    @Builder
    public BakeryLike(Bakery bakery, User user) {
        this.bakery = bakery;
        this.user = user;
    }
}

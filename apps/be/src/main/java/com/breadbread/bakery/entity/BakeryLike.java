package com.breadbread.bakery.entity;

import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(uniqueConstraints = {@UniqueConstraint(columnNames = {"bakery_id", "user_id"})})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
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

    @Builder
    public BakeryLike(Bakery bakery, User user) {
        this.bakery = bakery;
        this.user = user;
    }
}

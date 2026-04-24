package com.breadbread.auth.entity;

import com.breadbread.global.entity.BaseEntity;
import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"provider", "provider_user_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = "user")
public class SsoAccount extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SsoProvider provider;
    @Column(nullable = false)
    private String providerUserId;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    public SsoAccount(SsoProvider provider, String providerUserId, User user) {
        this.provider = provider;
        this.providerUserId = providerUserId;
        this.user = user;
    }
}

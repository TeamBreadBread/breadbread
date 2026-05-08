package com.breadbread.user.entity;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BakeryUseType;
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import lombok.*;

@Entity
@Table(name = "user_preference")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = "user")
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_bakery_types", joinColumns = @JoinColumn(name = "preference_id"))
    private List<BakeryType> bakeryTypes = new ArrayList<>();

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_bakery_moods", joinColumns = @JoinColumn(name = "preference_id"))
    private List<BakeryPersonality> bakeryMoods = new ArrayList<>();

    @ElementCollection
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_use_types", joinColumns = @JoinColumn(name = "preference_id"))
    private List<BakeryUseType> bakeryUseTypes = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    private WaitingTolerance waitingTolerance;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Builder
    public UserPreference(
            List<BakeryType> bakeryTypes,
            List<BakeryPersonality> bakeryPersonalities,
            List<BakeryUseType> bakeryUseTypes,
            WaitingTolerance waitingTolerance,
            User user) {
        this.bakeryTypes = bakeryTypes != null ? bakeryTypes : new ArrayList<>();
        this.bakeryMoods = bakeryPersonalities != null ? bakeryPersonalities : new ArrayList<>();
        this.bakeryUseTypes = bakeryUseTypes != null ? bakeryUseTypes : new ArrayList<>();
        this.waitingTolerance = waitingTolerance;
        this.user = user;
    }

    public void update(
            List<BakeryType> bakeryTypes,
            List<BakeryPersonality> bakeryPersonalities,
            List<BakeryUseType> bakeryUseTypes,
            WaitingTolerance waitingTolerance) {
        if (bakeryTypes != null) this.bakeryTypes = bakeryTypes;
        if (bakeryPersonalities != null) this.bakeryMoods = bakeryPersonalities;
        if (bakeryUseTypes != null) this.bakeryUseTypes = bakeryUseTypes;
        if (waitingTolerance != null) this.waitingTolerance = waitingTolerance;
    }
}

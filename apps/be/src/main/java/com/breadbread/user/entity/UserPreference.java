package com.breadbread.user.entity;

import com.breadbread.bakery.entity.BakeryPersonality;
import com.breadbread.bakery.entity.BakeryUseType;
import com.breadbread.bakery.entity.BreadType;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

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
    @CollectionTable(name = "user_bread_styles", joinColumns = @JoinColumn(name = "preference_id"))
    private List<BreadType> breadTypes = new ArrayList<>();

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
    public UserPreference(List<BreadType> breadTypes, List<BakeryPersonality> bakeryPersonalities,
                          List<BakeryUseType> bakeryUseTypes, WaitingTolerance waitingTolerance,
                          User user) {
        this.breadTypes = breadTypes != null ? breadTypes : new ArrayList<>();
        this.bakeryMoods = bakeryPersonalities != null ? bakeryPersonalities : new ArrayList<>();
        this.bakeryUseTypes = bakeryUseTypes != null ? bakeryUseTypes : new ArrayList<>();
        this.waitingTolerance = waitingTolerance;
        this.user = user;
    }

    public void update(List<BreadType> breadTypes, List<BakeryPersonality> bakeryPersonalities,
                       List<BakeryUseType> bakeryUseTypes, WaitingTolerance waitingTolerance) {
        this.breadTypes = breadTypes;
        this.bakeryMoods = bakeryPersonalities;
        this.bakeryUseTypes = bakeryUseTypes;
        this.waitingTolerance = waitingTolerance;
    }
}

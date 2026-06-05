package com.breadbread.congestion.entity;

import com.breadbread.global.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bakery_congestion_signal")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BakeryCongestionSignal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long bakeryId;

    private String bakeryName;

    private Double congestionScore;

    @Enumerated(EnumType.STRING)
    private CongestionLevel level;

    private Integer expectedWaitMin;

    @Column(columnDefinition = "text")
    private String reason;

    private Integer waitingKeywordCount;

    private Integer openRunKeywordCount;

    private Integer soldOutKeywordCount;

    private Integer recentMentionCount;

    private Integer morningMentions;

    private Integer afternoonMentions;

    private Integer eveningMentions;

    private LocalDateTime collectedAt;

    @Builder
    private BakeryCongestionSignal(
            Long bakeryId,
            String bakeryName,
            Double congestionScore,
            CongestionLevel level,
            Integer expectedWaitMin,
            String reason,
            Integer waitingKeywordCount,
            Integer openRunKeywordCount,
            Integer soldOutKeywordCount,
            Integer recentMentionCount,
            Integer morningMentions,
            Integer afternoonMentions,
            Integer eveningMentions,
            LocalDateTime collectedAt) {
        this.bakeryId = bakeryId;
        this.bakeryName = bakeryName;
        this.congestionScore = congestionScore;
        this.level = level;
        this.expectedWaitMin = expectedWaitMin;
        this.reason = reason;
        this.waitingKeywordCount = waitingKeywordCount;
        this.openRunKeywordCount = openRunKeywordCount;
        this.soldOutKeywordCount = soldOutKeywordCount;
        this.recentMentionCount = recentMentionCount;
        this.morningMentions = morningMentions;
        this.afternoonMentions = afternoonMentions;
        this.eveningMentions = eveningMentions;
        this.collectedAt = collectedAt;
    }
}

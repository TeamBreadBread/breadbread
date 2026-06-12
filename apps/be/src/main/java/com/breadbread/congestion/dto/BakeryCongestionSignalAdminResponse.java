package com.breadbread.congestion.dto;

import com.breadbread.congestion.entity.BakeryCongestionSignal;
import com.breadbread.congestion.entity.CongestionLevel;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class BakeryCongestionSignalAdminResponse {
    private Long id;
    private Long bakeryId;
    private String bakeryName;
    private Double congestionScore;
    private CongestionLevel level;
    private Integer expectedWaitMin;
    private String reason;
    private Signals signals;
    private LocalDateTime collectedAt;
    private LocalDateTime createdAt;

    @Getter
    @Builder
    public static class Signals {
        private Integer waitingKeywordCount;
        private Integer openRunKeywordCount;
        private Integer soldOutKeywordCount;
        private Integer recentMentionCount;
        private Integer morningMentions;
        private Integer afternoonMentions;
        private Integer eveningMentions;
    }

    public static BakeryCongestionSignalAdminResponse from(BakeryCongestionSignal signal) {
        return BakeryCongestionSignalAdminResponse.builder()
                .id(signal.getId())
                .bakeryId(signal.getBakeryId())
                .bakeryName(signal.getBakeryName())
                .congestionScore(signal.getCongestionScore())
                .level(signal.getLevel())
                .expectedWaitMin(signal.getExpectedWaitMin())
                .reason(signal.getReason())
                .signals(
                        Signals.builder()
                                .waitingKeywordCount(signal.getWaitingKeywordCount())
                                .openRunKeywordCount(signal.getOpenRunKeywordCount())
                                .soldOutKeywordCount(signal.getSoldOutKeywordCount())
                                .recentMentionCount(signal.getRecentMentionCount())
                                .morningMentions(signal.getMorningMentions())
                                .afternoonMentions(signal.getAfternoonMentions())
                                .eveningMentions(signal.getEveningMentions())
                                .build())
                .collectedAt(signal.getCollectedAt())
                .createdAt(signal.getCreatedAt())
                .build();
    }
}

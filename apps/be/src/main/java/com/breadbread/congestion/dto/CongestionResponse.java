package com.breadbread.congestion.dto;

import com.breadbread.congestion.entity.BakeryCongestionSignal;
import java.time.LocalDateTime;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CongestionResponse {

    private Long bakeryId;
    private String bakeryName;
    private String level;
    private Double congestionScore;
    private Integer expectedWaitMin;
    private String reason;
    private Signals signals;
    private LocalDateTime updatedAt;

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

    public static CongestionResponse from(BakeryCongestionSignal signal) {
        return CongestionResponse.builder()
                .bakeryId(signal.getBakeryId())
                .bakeryName(signal.getBakeryName())
                .level(signal.getLevel() != null ? signal.getLevel().name() : null)
                .congestionScore(signal.getCongestionScore())
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
                .updatedAt(signal.getUpdatedAt())
                .build();
    }
}

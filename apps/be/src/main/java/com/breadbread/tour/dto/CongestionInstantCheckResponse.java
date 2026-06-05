package com.breadbread.tour.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CongestionInstantCheckResponse {

    private boolean success;
    private List<CongestionResult> data;
    private String error;

    @Getter
    @NoArgsConstructor
    public static class CongestionResult {
        private Long userId;
        private Long courseId;
        private Long bakeryId;
        private String bakeryName;
        private Double congestionScore;
        private String level;
        private Integer expectedWaitMin;
        private String reason;
        private Signals signals;

        @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
        private LocalDateTime checkedAt;

        @Getter
        @NoArgsConstructor
        public static class Signals {
            private Integer waitingKeywordCount;
            private Integer openRunKeywordCount;
            private Integer soldOutKeywordCount;
            private Integer recentMentionCount;
            private Integer morningMentions;
            private Integer afternoonMentions;
            private Integer eveningMentions;
        }
    }
}

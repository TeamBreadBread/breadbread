package com.breadbread.congestion.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class CongestionSignalRequest {

    @NotNull private Long bakeryId;

    @NotBlank private String bakeryName;

    private Double congestionScore;

    private String level;

    private Integer expectedWaitMin;

    private String reason;

    @Valid private Signals signals;

    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime collectedAt;

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

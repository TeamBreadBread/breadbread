package com.breadbread.tour.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CongestionAlertWebhookResponse {

    private boolean success;
    private String type;
    private SuggestionData data;

    @Getter
    @NoArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public static class SuggestionData {
        private String type;
        private String title;
        private String message;
        private String recommendedAction;
        private List<Long> newBakeryOrder;
        private List<String> reasons;
        private List<String> buttons;
    }
}

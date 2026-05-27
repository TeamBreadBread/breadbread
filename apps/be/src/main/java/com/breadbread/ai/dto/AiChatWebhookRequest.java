package com.breadbread.ai.dto;

import com.breadbread.tour.dto.CongestionAlertWebhookRequest.CourseInfo;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;
import lombok.ToString;

@Getter
@Builder
@ToString(onlyExplicitlyIncluded = true)
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiChatWebhookRequest {

    private Long userId;
    private String conversationId; // 대화 세션 식별자
    private String message;
    private TourStateInfo tourState; // 투어 중일 때만 존재
    private CourseInfo course;

    @Getter
    @Builder
    public static class TourStateInfo {
        private Long courseId;
        private int currentVisitOrder;
        private int totalBakeryCount;
        private TourStatus status;

        public static TourStateInfo from(TourStateCache state) {
            return TourStateInfo.builder()
                    .courseId(state.getCourseId())
                    .currentVisitOrder(state.getCurrentVisitOrder())
                    .totalBakeryCount(state.getTotalBakeryCount())
                    .status(state.getStatus())
                    .build();
        }
    }
}

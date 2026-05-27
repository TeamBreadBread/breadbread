package com.breadbread.ai.service;

import com.breadbread.ai.client.AiChatWebhookClient;
import com.breadbread.ai.dto.AiChatRequest;
import com.breadbread.ai.dto.AiChatResponse;
import com.breadbread.ai.dto.AiChatWebhookRequest;
import com.breadbread.ai.dto.AiChatWebhookRequest.TourStateInfo;
import com.breadbread.tour.dto.CongestionAlertWebhookRequest.CourseInfo;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.service.CourseContextService;
import com.breadbread.tour.service.TourRedisService;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiChatService {

    private final CourseContextService courseContextService;
    private final TourRedisService tourRedisService;
    private final AiChatWebhookClient aiChatWebhookClient;

    public AiChatResponse chat(Long userId, AiChatRequest request) {
        CourseInfo courseInfo = null;
        if (request.getCourseId() != null) {
            // 활성 코스 여부 + 비공개 코스 접근 권한 검증 포함
            courseInfo = courseContextService.loadWithAccessCheck(userId, request.getCourseId());
        }

        Optional<TourStateCache> tourState = tourRedisService.getTourState(userId);

        // courseId와 투어 중인 코스가 다르면 tourState 제외
        TourStateInfo tourStateInfo =
                tourState
                        .filter(
                                s ->
                                        request.getCourseId() == null
                                                || s.getCourseId().equals(request.getCourseId()))
                        .map(TourStateInfo::from)
                        .orElse(null);

        AiChatWebhookRequest webhookRequest =
                AiChatWebhookRequest.builder()
                        .userId(userId)
                        .conversationId(request.getConversationId())
                        .message(request.getMessage())
                        .tourState(tourStateInfo)
                        .course(courseInfo)
                        .build();

        log.info(
                "[AI 채팅] 웹훅 호출: userId={}, courseId={}, hasTourState={}, conversationId={}",
                userId,
                request.getCourseId(),
                tourStateInfo != null,
                request.getConversationId());

        return aiChatWebhookClient.requestChat(webhookRequest);
    }
}

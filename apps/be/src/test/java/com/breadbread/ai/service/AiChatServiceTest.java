package com.breadbread.ai.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.ai.client.AiChatWebhookClient;
import com.breadbread.ai.dto.AiChatRequest;
import com.breadbread.ai.dto.AiChatResponse;
import com.breadbread.ai.dto.AiChatWebhookRequest;
import com.breadbread.tour.dto.CourseInfo;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.breadbread.tour.service.CourseContextService;
import com.breadbread.tour.service.TourRedisService;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AiChatServiceTest {

    @Mock private CourseContextService courseContextService;
    @Mock private TourRedisService tourRedisService;
    @Mock private AiChatWebhookClient aiChatWebhookClient;

    @InjectMocks private AiChatService aiChatService;

    // ── courseId 없음 ──────────────────────────────────────────────────────────

    @Test
    void courseId_없으면_courseContextService_미호출() {
        AiChatRequest request = request(null, "안녕");
        AiChatResponse response = new AiChatResponse();
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(aiChatWebhookClient.requestChat(any())).thenReturn(response);

        aiChatService.chat(1L, request);

        verify(courseContextService, never()).loadWithAccessCheck(anyLong(), anyLong());
    }

    @Test
    void courseId_없고_투어_중이면_tourState_포함() {
        AiChatRequest request = request(null, "안녕");
        TourStateCache state = tourState(10L);
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.of(state));
        when(aiChatWebhookClient.requestChat(any())).thenReturn(new AiChatResponse());

        aiChatService.chat(1L, request);

        ArgumentCaptor<AiChatWebhookRequest> captor =
                ArgumentCaptor.forClass(AiChatWebhookRequest.class);
        verify(aiChatWebhookClient).requestChat(captor.capture());
        assertThat(captor.getValue().getTourState()).isNotNull();
        assertThat(captor.getValue().getTourState().getCourseId()).isEqualTo(10L);
    }

    // ── courseId 있음 ──────────────────────────────────────────────────────────

    @Test
    void courseId_있으면_courseContextService_호출() {
        AiChatRequest request = request(10L, "코스 추천해줘");
        CourseInfo courseInfo = CourseInfo.builder().courseId(10L).build();
        when(courseContextService.loadWithAccessCheck(1L, 10L)).thenReturn(courseInfo);
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(aiChatWebhookClient.requestChat(any())).thenReturn(new AiChatResponse());

        aiChatService.chat(1L, request);

        verify(courseContextService).loadWithAccessCheck(1L, 10L);

        ArgumentCaptor<AiChatWebhookRequest> captor =
                ArgumentCaptor.forClass(AiChatWebhookRequest.class);
        verify(aiChatWebhookClient).requestChat(captor.capture());
        assertThat(captor.getValue().getCourse()).isEqualTo(courseInfo);
    }

    @Test
    void courseId_있고_tourState_courseId_일치하면_tourState_포함() {
        AiChatRequest request = request(10L, "지금 어디야");
        when(courseContextService.loadWithAccessCheck(1L, 10L))
                .thenReturn(CourseInfo.builder().courseId(10L).build());
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.of(tourState(10L)));
        when(aiChatWebhookClient.requestChat(any())).thenReturn(new AiChatResponse());

        aiChatService.chat(1L, request);

        ArgumentCaptor<AiChatWebhookRequest> captor =
                ArgumentCaptor.forClass(AiChatWebhookRequest.class);
        verify(aiChatWebhookClient).requestChat(captor.capture());
        assertThat(captor.getValue().getTourState()).isNotNull();
    }

    @Test
    void courseId_있고_tourState_courseId_불일치하면_tourState_제외() {
        AiChatRequest request = request(10L, "다른 코스야");
        when(courseContextService.loadWithAccessCheck(1L, 10L))
                .thenReturn(CourseInfo.builder().courseId(10L).build());
        // 투어 중인 코스는 20L, 요청 courseId는 10L → 제외
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.of(tourState(20L)));
        when(aiChatWebhookClient.requestChat(any())).thenReturn(new AiChatResponse());

        aiChatService.chat(1L, request);

        ArgumentCaptor<AiChatWebhookRequest> captor =
                ArgumentCaptor.forClass(AiChatWebhookRequest.class);
        verify(aiChatWebhookClient).requestChat(captor.capture());
        assertThat(captor.getValue().getTourState()).isNull();
    }

    // ── 투어 없음 ──────────────────────────────────────────────────────────────

    @Test
    void 투어_없으면_tourState_null() {
        AiChatRequest request = request(null, "투어 없음");
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(aiChatWebhookClient.requestChat(any())).thenReturn(new AiChatResponse());

        aiChatService.chat(1L, request);

        ArgumentCaptor<AiChatWebhookRequest> captor =
                ArgumentCaptor.forClass(AiChatWebhookRequest.class);
        verify(aiChatWebhookClient).requestChat(captor.capture());
        assertThat(captor.getValue().getTourState()).isNull();
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private AiChatRequest request(Long courseId, String message) {
        AiChatRequest req = new AiChatRequest();
        ReflectionTestUtils.setField(req, "message", message);
        ReflectionTestUtils.setField(req, "courseId", courseId);
        return req;
    }

    private TourStateCache tourState(Long courseId) {
        return TourStateCache.builder()
                .userId(1L)
                .courseId(courseId)
                .totalBakeryCount(3)
                .currentVisitOrder(1)
                .status(TourStatus.IN_PROGRESS)
                .startedAt("2026-01-01T10:00:00")
                .build();
    }
}

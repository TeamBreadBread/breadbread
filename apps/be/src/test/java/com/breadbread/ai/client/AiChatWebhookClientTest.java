package com.breadbread.ai.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import com.breadbread.ai.dto.AiChatResponse;
import com.breadbread.ai.dto.AiChatWebhookRequest;
import com.breadbread.global.config.AiProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;

@ExtendWith(MockitoExtension.class)
class AiChatWebhookClientTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient webClient;

    private ObjectMapper objectMapper;
    private AiProperties aiProperties;
    private AiChatWebhookClient client;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        aiProperties = new AiProperties();
        aiProperties.setChatWebhookUrl("http://ai.local/curator/chat");
        aiProperties.setWebhookTimeoutSeconds(10);
        client = new AiChatWebhookClient(webClient, objectMapper, aiProperties);
    }

    // ── parseResponse ──────────────────────────────────────────────────────────

    @Test
    void parseResponse_성공_응답_반환() {
        String json =
                "{\"success\":true,\"type\":\"chat\","
                        + "\"data\":{\"message\":\"안녕하세요\",\"conversationId\":\"c1\",\"messageId\":\"m1\"}}";

        AiChatResponse response =
                (AiChatResponse) ReflectionTestUtils.invokeMethod(client, "parseResponse", json);

        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getType()).isEqualTo("chat");
        assertThat(response.getData().getMessage()).isEqualTo("안녕하세요");
        assertThat(response.getData().getConversationId()).isEqualTo("c1");
    }

    @Test
    void parseResponse_success_false_AI_SERVER_ERROR() {
        String json = "{\"success\":false,\"type\":\"error\"}";

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(client, "parseResponse", json))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_SERVER_ERROR);
    }

    @Test
    void parseResponse_잘못된_JSON_PARSE_ERROR() {
        assertThatThrownBy(
                        () ->
                                ReflectionTestUtils.invokeMethod(
                                        client, "parseResponse", "not-json{{"))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_PARSE_ERROR);
    }

    // ── fetchRawBody ───────────────────────────────────────────────────────────

    @Test
    void fetchRawBody_빈_응답_EMPTY_RESPONSE() {
        when(webClient
                        .post()
                        .uri(anyString())
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenReturn(null);

        AiChatWebhookRequest request =
                AiChatWebhookRequest.builder().userId(1L).message("안녕").build();

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(client, "fetchRawBody", request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);
    }

    @Test
    void fetchRawBody_공백_응답_EMPTY_RESPONSE() {
        when(webClient
                        .post()
                        .uri(anyString())
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenReturn("   ");

        AiChatWebhookRequest request =
                AiChatWebhookRequest.builder().userId(1L).message("안녕").build();

        assertThatThrownBy(() -> ReflectionTestUtils.invokeMethod(client, "fetchRawBody", request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);
    }
}

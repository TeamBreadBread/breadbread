package com.breadbread.tour.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.breadbread.global.config.AiProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.CongestionInstantCheckResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Answers;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.reactive.function.client.WebClient;

@ExtendWith(MockitoExtension.class)
class CongestionInstantCheckClientTest {

    @Mock(answer = Answers.RETURNS_DEEP_STUBS)
    private WebClient webClient;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AiProperties aiProperties;
    private CongestionInstantCheckClient client;

    @BeforeEach
    void setUp() {
        aiProperties = new AiProperties();
        aiProperties.setCongestionWebhookUrl("https://n8n.test/webhook/congestion");
        aiProperties.setWebhookTimeoutSeconds(10);
        client = new CongestionInstantCheckClient(webClient, objectMapper, aiProperties);
    }

    // ── check ─────────────────────────────────────────────────────────────────

    @Test
    void check_returnsResponse_whenSuccessful() throws Exception {
        CongestionInstantCheckResponse.CongestionResult result =
                new CongestionInstantCheckResponse.CongestionResult();

        String json =
                objectMapper.writeValueAsString(
                        Map.of("success", true, "data", List.of(), "error", ""));

        when(webClient
                        .post()
                        .uri(any(String.class))
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenReturn(json);

        CongestionInstantCheckResponse response =
                client.check(Map.of("userId", 1L, "courseId", 10L));

        assertThat(response.isSuccess()).isTrue();
    }

    @Test
    void check_throws_EMPTY_RESPONSE_whenBodyIsNull() {
        when(webClient
                        .post()
                        .uri(any(String.class))
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenReturn(null);

        assertThatThrownBy(() -> client.check(Map.of("userId", 1L, "courseId", 10L)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);
    }

    @Test
    void check_throws_EMPTY_RESPONSE_whenBodyIsBlank() {
        when(webClient
                        .post()
                        .uri(any(String.class))
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenReturn("   ");

        assertThatThrownBy(() -> client.check(Map.of("userId", 1L, "courseId", 10L)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);
    }

    @Test
    void check_throws_AI_SERVER_ERROR_whenSuccessIsFalse() throws Exception {
        String json = objectMapper.writeValueAsString(Map.of("success", false, "error", "AI 오류"));

        when(webClient
                        .post()
                        .uri(any(String.class))
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenReturn(json);

        assertThatThrownBy(() -> client.check(Map.of("userId", 1L, "courseId", 10L)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_SERVER_ERROR);
    }

    @Test
    void check_throws_PARSE_ERROR_whenInvalidJson() {
        when(webClient
                        .post()
                        .uri(any(String.class))
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenReturn("not-json");

        assertThatThrownBy(() -> client.check(Map.of("userId", 1L, "courseId", 10L)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_PARSE_ERROR);
    }

    @Test
    void check_throws_TIMEOUT_whenTimeoutException() {
        when(webClient
                        .post()
                        .uri(any(String.class))
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenThrow(
                        reactor.core.Exceptions.propagate(
                                new java.util.concurrent.TimeoutException()));

        assertThatThrownBy(() -> client.check(Map.of("userId", 1L, "courseId", 10L)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_TIMEOUT);
    }

    @Test
    void check_throws_CONNECTION_ERROR_whenOtherException() {
        when(webClient
                        .post()
                        .uri(any(String.class))
                        .contentType(any())
                        .bodyValue(any())
                        .retrieve()
                        .onStatus(any(), any())
                        .bodyToMono(String.class)
                        .timeout(any(java.time.Duration.class))
                        .block())
                .thenThrow(new RuntimeException("connection refused"));

        assertThatThrownBy(() -> client.check(Map.of("userId", 1L, "courseId", 10L)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_WEBHOOK_CONNECTION_ERROR);
    }
}

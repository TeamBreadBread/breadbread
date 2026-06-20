package com.breadbread.ai.client;

import com.breadbread.ai.dto.AiChatResponse;
import com.breadbread.ai.dto.AiChatWebhookRequest;
import com.breadbread.global.config.AiProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class AiChatWebhookClient {

    private final WebClient client;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;

    public AiChatResponse requestChat(AiChatWebhookRequest request) {
        log.info(
                "[AI 채팅 웹훅] 요청 시작: messageLength={}",
                request.getMessage() == null ? 0 : request.getMessage().length());
        String rawBody = fetchRawBody(request);
        return parseResponse(rawBody);
    }

    private String fetchRawBody(AiChatWebhookRequest request) {
        long start = System.currentTimeMillis();
        try {
            String rawBody =
                    client.post()
                            .uri(aiProperties.getChatWebhookUrl())
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(request)
                            .retrieve()
                            .onStatus(
                                    HttpStatusCode::isError,
                                    res -> {
                                        log.error(
                                                "[AI 채팅 웹훅] HTTP 오류: status={}", res.statusCode());
                                        return Mono.error(
                                                new CustomException(
                                                        ErrorCode.AI_WEBHOOK_HTTP_ERROR));
                                    })
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(aiProperties.getWebhookTimeoutSeconds()))
                            .block();

            if (rawBody == null || rawBody.isBlank()) {
                log.error("[AI 채팅 웹훅] 응답 body 비어있음");
                throw new CustomException(ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);
            }
            return rawBody;

        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            if (reactor.core.Exceptions.unwrap(e)
                    instanceof java.util.concurrent.TimeoutException) {
                log.warn(
                        "[AI 채팅 웹훅] 타임아웃: elapsed={}ms, timeout={}s",
                        elapsed,
                        aiProperties.getWebhookTimeoutSeconds());
                throw new CustomException(ErrorCode.AI_WEBHOOK_TIMEOUT);
            }
            log.error("[AI 채팅 웹훅] 호출 실패: elapsed={}ms", elapsed, e);
            throw new CustomException(ErrorCode.AI_WEBHOOK_CONNECTION_ERROR);
        }
    }

    private AiChatResponse parseResponse(String rawBody) {
        try {
            AiChatResponse response = objectMapper.readValue(rawBody, AiChatResponse.class);
            if (!response.isSuccess()) {
                log.warn("[AI 채팅 웹훅] 실패 응답 수신: type={}", response.getType());
                throw new CustomException(ErrorCode.AI_SERVER_ERROR);
            }
            return response;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[AI 채팅 웹훅] JSON 파싱 실패", e);
            throw new CustomException(ErrorCode.AI_WEBHOOK_PARSE_ERROR);
        }
    }
}

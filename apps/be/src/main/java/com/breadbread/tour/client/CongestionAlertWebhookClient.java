package com.breadbread.tour.client;

import com.breadbread.global.config.AiProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.CongestionAlertWebhookRequest;
import com.breadbread.tour.dto.CongestionAlertWebhookResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Slf4j
@Component
@RequiredArgsConstructor
public class CongestionAlertWebhookClient {

    private final WebClient client;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;

    public CongestionAlertWebhookResponse requestAlert(CongestionAlertWebhookRequest request) {
        log.info(
                "[혼잡도 웹훅] 요청 시작: userId={}, url={}",
                request.getUserId(),
                aiProperties.getCongestionWebhookUrl());

        String rawBody;
        long start = System.currentTimeMillis();
        try {
            rawBody =
                    client.post()
                            .uri(aiProperties.getCongestionWebhookUrl())
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(request)
                            .retrieve()
                            .onStatus(
                                    HttpStatusCode::isError,
                                    res -> handleErrorStatus(request.getUserId(), res))
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(aiProperties.getWebhookTimeoutSeconds()))
                            .block();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            if (reactor.core.Exceptions.unwrap(e)
                    instanceof java.util.concurrent.TimeoutException) {
                log.warn(
                        "[혼잡도 웹훅] 타임아웃: userId={}, timeout={}s",
                        request.getUserId(),
                        aiProperties.getWebhookTimeoutSeconds());
                throw new CustomException(ErrorCode.AI_WEBHOOK_TIMEOUT);
            }
            log.error(
                    "[혼잡도 웹훅] 호출 실패: userId={}, elapsed={}ms",
                    request.getUserId(),
                    System.currentTimeMillis() - start,
                    e);
            throw new CustomException(ErrorCode.AI_WEBHOOK_CONNECTION_ERROR);
        }

        if (rawBody == null || rawBody.isBlank()) {
            log.error("[혼잡도 웹훅] 응답 body 비어있음: userId={}", request.getUserId());
            throw new CustomException(ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);
        }

        try {
            CongestionAlertWebhookResponse response =
                    objectMapper.readValue(rawBody, CongestionAlertWebhookResponse.class);
            if (!response.isSuccess()) {
                log.warn(
                        "[혼잡도 웹훅] 실패 응답 수신: userId={}, type={}",
                        request.getUserId(),
                        response.getType());
                throw new CustomException(ErrorCode.AI_SERVER_ERROR);
            }
            return response;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[혼잡도 웹훅] JSON 파싱 실패: userId={}", request.getUserId(), e);
            throw new CustomException(ErrorCode.AI_WEBHOOK_PARSE_ERROR);
        }
    }

    private Mono<? extends Throwable> handleErrorStatus(Long userId, ClientResponse res) {
        return res.bodyToMono(String.class)
                .flatMap(
                        body -> {
                            log.error(
                                    "[혼잡도 웹훅] HTTP 오류: userId={}, status={}",
                                    userId,
                                    res.statusCode());
                            return Mono.error(new CustomException(ErrorCode.AI_WEBHOOK_HTTP_ERROR));
                        });
    }
}

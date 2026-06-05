package com.breadbread.tour.client;

import com.breadbread.global.config.AiProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.CongestionInstantCheckResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.Duration;
import java.util.Map;
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
public class CongestionInstantCheckClient {

    private final WebClient client;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;

    public CongestionInstantCheckResponse check(Map<String, Object> requestBody) {
        Object userId = requestBody.get("userId");
        Object courseId = requestBody.get("courseId");
        log.info("[혼잡도 즉시 체크] 웹훅 요청: userId={}, courseId={}", userId, courseId);
        long start = System.currentTimeMillis();

        String rawBody;
        try {
            rawBody =
                    client.post()
                            .uri(aiProperties.getCongestionWebhookUrl())
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(requestBody)
                            .retrieve()
                            .onStatus(
                                    HttpStatusCode::isError,
                                    res -> {
                                        log.error(
                                                "[혼잡도 즉시 체크] HTTP 오류: userId={}, status={}",
                                                userId,
                                                res.statusCode());
                                        return Mono.error(
                                                new CustomException(
                                                        ErrorCode.AI_WEBHOOK_HTTP_ERROR));
                                    })
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(aiProperties.getWebhookTimeoutSeconds()))
                            .block();
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            long elapsed = System.currentTimeMillis() - start;
            if (reactor.core.Exceptions.unwrap(e)
                    instanceof java.util.concurrent.TimeoutException) {
                log.warn(
                        "[혼잡도 즉시 체크] 타임아웃: userId={}, elapsed={}ms, timeout={}s",
                        userId,
                        elapsed,
                        aiProperties.getWebhookTimeoutSeconds());
                throw new CustomException(ErrorCode.AI_WEBHOOK_TIMEOUT);
            }
            log.error("[혼잡도 즉시 체크] 호출 실패: userId={}, elapsed={}ms", userId, elapsed, e);
            throw new CustomException(ErrorCode.AI_WEBHOOK_CONNECTION_ERROR);
        }

        if (rawBody == null || rawBody.isBlank()) {
            log.error("[혼잡도 즉시 체크] 응답 body 비어있음: userId={}", userId);
            throw new CustomException(ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);
        }

        try {
            CongestionInstantCheckResponse response =
                    objectMapper.readValue(rawBody, CongestionInstantCheckResponse.class);
            if (!response.isSuccess()) {
                log.warn("[혼잡도 즉시 체크] 실패 응답: userId={}, error={}", userId, response.getError());
                throw new CustomException(ErrorCode.AI_SERVER_ERROR);
            }
            log.info(
                    "[혼잡도 즉시 체크] 완료: userId={}, elapsed={}ms",
                    userId,
                    System.currentTimeMillis() - start);
            return response;
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error("[혼잡도 즉시 체크] JSON 파싱 실패: userId={}", userId, e);
            throw new CustomException(ErrorCode.AI_WEBHOOK_PARSE_ERROR);
        }
    }
}

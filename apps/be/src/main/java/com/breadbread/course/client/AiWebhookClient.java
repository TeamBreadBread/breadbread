package com.breadbread.course.client;

import com.breadbread.course.dto.ai.AiCourseWebhookRequest;
import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.global.config.AiProperties;
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
public class AiWebhookClient {

    private final WebClient client;
    private final ObjectMapper objectMapper;
    private final AiProperties aiProperties;

    public AiCourseWebhookResponse requestCourse(String jobId, AiCourseWebhookRequest request) {
        log.info(
                "[AI 웹훅] 요청 시작: jobId={}, bakeryCount={}",
                jobId,
                request.getBakeries() != null ? request.getBakeries().size() : 0);

        String rawBody;
        long start = System.currentTimeMillis();
        try {
            rawBody =
                    client.post()
                            .uri(aiProperties.getWebhookUrl())
                            .contentType(MediaType.APPLICATION_JSON)
                            .bodyValue(request)
                            .retrieve()
                            .onStatus(
                                    HttpStatusCode::isError,
                                    res ->
                                            res.bodyToMono(String.class)
                                                    .flatMap(
                                                            body -> {
                                                                log.error(
                                                                        "[AI 웹훅] HTTP 오류 응답: jobId={}, status={}, body={}",
                                                                        jobId,
                                                                        res.statusCode(),
                                                                        body);
                                                                return Mono.error(
                                                                        new IllegalStateException(
                                                                                "AI 웹훅 HTTP 오류 ("
                                                                                        + res.statusCode()
                                                                                        + "). n8n 워크플로 실행·URL을 확인하세요."));
                                                            }))
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(aiProperties.getWebhookTimeoutSeconds()))
                            .block();
            log.info(
                    "[AI 웹훅] 응답 수신 완료: jobId={}, elapsed={}ms",
                    jobId,
                    System.currentTimeMillis() - start);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error(
                    "[AI 웹훅] 웹훅 호출 실패: jobId={}, elapsed={}ms",
                    jobId,
                    System.currentTimeMillis() - start,
                    e);
            int timeoutSec = aiProperties.getWebhookTimeoutSeconds();
            if (e instanceof java.util.concurrent.TimeoutException
                    || (e.getMessage() != null && e.getMessage().contains("Timeout"))) {
                throw new IllegalStateException(
                        "AI 처리 시간 초과 ("
                                + timeoutSec
                                + "초). n8n/Dify 실행 시간을 줄이거나 서버 AI_WEBHOOK_TIMEOUT_SECONDS를 늘려 주세요.");
            }
            throw new IllegalStateException(
                    "AI 웹훅에 연결하지 못했습니다. AI_COURSE_WEBHOOK_URL·n8n 워크플로 상태를 확인하세요.");
        }

        if (rawBody == null || rawBody.isBlank()) {
            log.error("[AI 웹훅] 응답 body가 비어있음");
            throw new IllegalStateException(
                    "AI 웹훅 응답이 비어 있습니다. n8n 마지막 노드가 JSON 본문을 반환하는지 확인하세요.");
        }

        try {
            AiCourseWebhookResponse response =
                    objectMapper.readValue(rawBody, AiCourseWebhookResponse.class);
            log.debug(
                    "[AI 웹훅] 응답 파싱 완료: jobId={}, name={}, bakeryCount={}",
                    jobId,
                    response.getName(),
                    response.getBakeries() != null ? response.getBakeries().size() : 0);
            return response;
        } catch (Exception e) {
            log.error("[AI 웹훅] JSON 파싱 실패: jobId={}, bodyPreview={}", jobId, preview(rawBody), e);
            throw new IllegalStateException(
                    "AI 응답 JSON 형식이 맞지 않습니다. Dify/n8n 마지막 노드가 백엔드 스키마(JSON)를 반환하는지 확인하세요.");
        }
    }

    private static String preview(String body) {
        if (body == null) {
            return "";
        }
        String trimmed = body.strip();
        return trimmed.length() <= 200 ? trimmed : trimmed.substring(0, 200) + "…";
    }
}

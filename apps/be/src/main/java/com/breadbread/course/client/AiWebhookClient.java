package com.breadbread.course.client;

import com.breadbread.course.dto.ai.AiCourseWebhookRequest;
import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
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
                                                                        new CustomException(
                                                                                ErrorCode
                                                                                        .AI_SERVER_ERROR));
                                                            }))
                            .bodyToMono(String.class)
                            .timeout(Duration.ofSeconds(aiProperties.getWebhookTimeoutSeconds()))
                            .block();
            log.info(
                    "[AI 웹훅] 응답 수신 완료: jobId={}, elapsed={}ms",
                    jobId,
                    System.currentTimeMillis() - start);
        } catch (CustomException e) {
            throw e;
        } catch (Exception e) {
            log.error(
                    "[AI 웹훅] 웹훅 호출 실패: jobId={}, elapsed={}ms",
                    jobId,
                    System.currentTimeMillis() - start,
                    e);
            throw new CustomException(ErrorCode.AI_SERVER_ERROR);
        }

        if (rawBody == null || rawBody.isBlank()) {
            log.error("[AI 웹훅] 응답 body가 비어있음");
            throw new CustomException(ErrorCode.AI_SERVER_ERROR);
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
            log.error("[AI 웹훅] JSON 파싱 실패: jobId={}", jobId, e);
            throw new CustomException(ErrorCode.AI_SERVER_ERROR);
        }
    }
}

package com.breadbread.global.filter;

import com.breadbread.global.config.RateLimitProperties;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.service.RateLimitRedisService;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
@RequiredArgsConstructor
public class AuthRateLimitFilter extends OncePerRequestFilter {
    private final RateLimitRedisService rateLimitRedisService;
    private final RateLimitProperties rateLimitProperties;
    private final ObjectMapper objectMapper;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        String clientIp = getClientIp(request);

        try {
            for (RateLimitProperties.Rule rule : rateLimitProperties.getRules()) {
                if (rule.getMethod().equalsIgnoreCase(method) && rule.getUris().contains(uri)) {
                    String key =
                            "rate-limit:"
                                    + method.toLowerCase()
                                    + ":"
                                    + uri.replace("/", "-")
                                    + ":"
                                    + clientIp;
                    rateLimitRedisService.checkLimit(
                            key, rule.getTtlSeconds(), rule.getMaxRequests());
                    break;
                }
            }

            filterChain.doFilter(request, response);

        } catch (CustomException e) {
            if (e.getErrorCode() != ErrorCode.TOO_MANY_REQUESTS) {
                throw e;
            }

            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");

            if (e.getRetryAfterSeconds() != null) {
                response.setHeader("Retry-After", String.valueOf(e.getRetryAfterSeconds()));
            }

            String body =
                    objectMapper.writeValueAsString(ApiResponse.fail(ErrorCode.TOO_MANY_REQUESTS));
            response.getWriter().write(body);
        }
    }

    private String getClientIp(HttpServletRequest request) {
        // Cloud Run / Google LB: "client, google-lb-ip" 형태로 추가
        // 끝에서 두 번째가 실제 클라이언트 IP (마지막은 LB 자신)
        // X-Real-IP는 Cloud Run에서 LB가 설정하지 않으므로 신뢰하지 않음
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            String[] parts = xForwardedFor.split(",");
            if (parts.length >= 2) {
                return parts[parts.length - 2].trim();
            }
            return parts[0].trim();
        }

        return request.getRemoteAddr();
    }
}

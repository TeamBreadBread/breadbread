package com.breadbread.global.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.breadbread.global.config.RateLimitProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.service.RateLimitRedisService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

@ExtendWith(MockitoExtension.class)
class AuthRateLimitFilterTest {

    @Mock private RateLimitRedisService rateLimitRedisService;
    @Mock private RateLimitProperties rateLimitProperties;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AuthRateLimitFilter filter;

    @BeforeEach
    void setUp() {
        filter = new AuthRateLimitFilter(rateLimitRedisService, rateLimitProperties, objectMapper);

        RateLimitProperties.Rule rule = new RateLimitProperties.Rule();
        rule.setMethod("POST");
        rule.setUris(List.of("/auth/login", "/auth/signup"));
        rule.setTtlSeconds(60);
        rule.setMaxRequests(10);

        org.mockito.Mockito.when(rateLimitProperties.getRules()).thenReturn(List.of(rule));
    }

    // ── checkLimit 호출 여부 ───────────────────────────────────────────────────

    @Test
    void configuredUri_callsCheckLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
        request.setRemoteAddr("1.2.3.4");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        doNothing().when(rateLimitRedisService).checkLimit(anyString(), anyLong(), anyLong());

        filter.doFilterInternal(request, response, chain);

        verify(rateLimitRedisService).checkLimit(anyString(), anyLong(), anyLong());
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void unconfiguredUri_skipsCheckLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/courses");
        request.setRemoteAddr("1.2.3.4");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);

        verify(rateLimitRedisService, never()).checkLimit(anyString(), anyLong(), anyLong());
        assertThat(response.getStatus()).isEqualTo(200);
    }

    @Test
    void unconfiguredMethod_skipsCheckLimit() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/auth/login");
        request.setRemoteAddr("1.2.3.4");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        filter.doFilterInternal(request, response, chain);

        verify(rateLimitRedisService, never()).checkLimit(anyString(), anyLong(), anyLong());
    }

    // ── 429 응답 ──────────────────────────────────────────────────────────────

    @Test
    void whenRateLimitExceeded_returns429WithRetryAfter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
        request.setRemoteAddr("1.2.3.4");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        doThrow(new CustomException(ErrorCode.TOO_MANY_REQUESTS, 30L))
                .when(rateLimitRedisService)
                .checkLimit(anyString(), anyLong(), anyLong());

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isEqualTo("30");
        assertThat(response.getContentAsString()).contains("E0007");
    }

    @Test
    void whenRateLimitExceeded_doesNotCallFilterChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
        request.setRemoteAddr("1.2.3.4");
        MockFilterChain chain = new MockFilterChain();

        doThrow(new CustomException(ErrorCode.TOO_MANY_REQUESTS, 30L))
                .when(rateLimitRedisService)
                .checkLimit(anyString(), anyLong(), anyLong());

        filter.doFilterInternal(request, new MockHttpServletResponse(), chain);

        assertThat(chain.getRequest()).isNull();
    }

    // ── IP 추출 ───────────────────────────────────────────────────────────────

    @Test
    void cloudRun_xForwardedFor_extractsClientIp() throws Exception {
        // Cloud Run: "client, lb" 형태 → client를 rate limit 키에 사용
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
        request.addHeader("X-Forwarded-For", "203.0.113.10, 35.191.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        doNothing().when(rateLimitRedisService).checkLimit(anyString(), anyLong(), anyLong());

        filter.doFilterInternal(request, response, chain);

        verify(rateLimitRedisService)
                .checkLimit(
                        org.mockito.ArgumentMatchers.contains("203.0.113.10"),
                        anyLong(),
                        anyLong());
    }

    @Test
    void singleIp_xForwardedFor_usesIt() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
        request.addHeader("X-Forwarded-For", "203.0.113.10");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        doNothing().when(rateLimitRedisService).checkLimit(anyString(), anyLong(), anyLong());

        filter.doFilterInternal(request, response, chain);

        verify(rateLimitRedisService)
                .checkLimit(
                        org.mockito.ArgumentMatchers.contains("203.0.113.10"),
                        anyLong(),
                        anyLong());
    }

    @Test
    void noXForwardedFor_usesRemoteAddr() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/auth/login");
        request.setRemoteAddr("192.168.1.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockFilterChain chain = new MockFilterChain();

        doNothing().when(rateLimitRedisService).checkLimit(anyString(), anyLong(), anyLong());

        filter.doFilterInternal(request, response, chain);

        verify(rateLimitRedisService)
                .checkLimit(
                        org.mockito.ArgumentMatchers.contains("192.168.1.1"), anyLong(), anyLong());
    }
}

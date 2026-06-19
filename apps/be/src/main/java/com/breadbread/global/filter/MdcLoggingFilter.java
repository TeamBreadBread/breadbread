package com.breadbread.global.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class MdcLoggingFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        long startMs = System.currentTimeMillis();
        try {
            MDC.put("requestId", UUID.randomUUID().toString().substring(0, 8));
            MDC.put("httpMethod", request.getMethod());
            MDC.put("httpPath", request.getRequestURI());
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = System.currentTimeMillis() - startMs;
            MDC.put("httpStatus", String.valueOf(response.getStatus()));
            MDC.put("durationMs", String.valueOf(durationMs));
            log.info("ACCESS");
            MDC.clear();
        }
    }
}

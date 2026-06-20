package com.breadbread.global.filter;

import com.breadbread.global.config.AiProperties;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

@RequiredArgsConstructor
public class AiApiKeyFilter extends OncePerRequestFilter {

    private static final String API_KEY_HEADER = "X-AI-API-KEY";

    private final AiProperties aiProperties;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String uri = request.getRequestURI();
        String method = request.getMethod();
        return !((uri.startsWith("/admin/congestion") && !"GET".equals(method))
                || (uri.startsWith("/admin/trends") && !"GET".equals(method))
                || uri.startsWith("/admin/tours/active")
                || (uri.startsWith("/admin/bakeries")
                        && uri.contains("sync-kakao")
                        && "POST".equals(method))
                || (uri.startsWith("/notifications/curator") && "POST".equals(method)));
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String key = request.getHeader(API_KEY_HEADER);

        if (aiProperties.getApiKey() != null && aiProperties.getApiKey().equals(key)) {
            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            "n8n", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } else {
            response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter()
                    .write(
                            "{\"success\":false,\"error\":{\"code\":\"E0423\","
                                    + "\"message\":\"유효하지 않은 API 키입니다.\"}}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}

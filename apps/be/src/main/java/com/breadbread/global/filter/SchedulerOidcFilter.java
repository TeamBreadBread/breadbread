package com.breadbread.global.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.web.filter.OncePerRequestFilter;

@Slf4j
@RequiredArgsConstructor
public class SchedulerOidcFilter extends OncePerRequestFilter {

    private final JwtDecoder jwtDecoder;
    private final String schedulerServiceAccount;
    private final String schedulerAudience;
    private final ObjectMapper objectMapper;

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        return !request.getRequestURI().startsWith("/scheduler/");
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            rejectUnauthorized(response, "Authorization 헤더가 없거나 형식이 올바르지 않습니다.");
            return;
        }

        String token = authHeader.substring(7);
        try {
            Jwt jwt = jwtDecoder.decode(token);
            String email = jwt.getClaimAsString("email");
            List<String> audience = jwt.getAudience();

            if (!schedulerServiceAccount.equals(email)) {
                log.warn("[스케줄러 OIDC] 서비스 계정 불일치: email={}", email);
                rejectUnauthorized(response, "허용되지 않은 서비스 계정입니다.");
                return;
            }

            if (schedulerAudience != null
                    && !schedulerAudience.isBlank()
                    && (audience == null || !audience.contains(schedulerAudience))) {
                log.warn("[스케줄러 OIDC] audience 불일치: aud={}", audience);
                rejectUnauthorized(response, "audience가 올바르지 않습니다.");
                return;
            }

            UsernamePasswordAuthenticationToken auth =
                    new UsernamePasswordAuthenticationToken(
                            email, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
            SecurityContextHolder.getContext().setAuthentication(auth);
            log.debug("[스케줄러 OIDC] 인증 성공: email={}", email);

        } catch (JwtException e) {
            log.warn("[스케줄러 OIDC] 토큰 검증 실패: {}", e.getMessage());
            rejectUnauthorized(response, "유효하지 않은 OIDC 토큰입니다.");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void rejectUnauthorized(HttpServletResponse response, String message)
            throws IOException {
        response.setContentType(MediaType.APPLICATION_JSON_VALUE + ";charset=UTF-8");
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.getWriter()
                .write(
                        "{\"success\":false,\"error\":{\"code\":\"E0401\",\"message\":\""
                                + message
                                + "\"}}");
    }
}

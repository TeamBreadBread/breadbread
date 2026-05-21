package com.breadbread.global.jwt;

import com.breadbread.global.config.JwtProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.Optional;
import javax.crypto.SecretKey;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtProvider {
    private final JwtProperties jwtProperties;

    private SecretKey accessKey;
    private SecretKey refreshKey;

    @PostConstruct
    public void init() {
        this.accessKey = Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes());
        this.refreshKey = Keys.hmacShaKeyFor(jwtProperties.getRefreshSecret().getBytes());
    }

    public String createAccessToken(String userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + jwtProperties.getExpiresIn() * 1000))
                .signWith(accessKey)
                .compact();
    }

    public String createRefreshToken(String userId) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + jwtProperties.getRefreshExpiresIn() * 1000))
                .signWith(refreshKey)
                .compact();
    }

    public String getUserIdFromAccessToken(String token) {
        return parseClaims(token, accessKey).getSubject();
    }

    /** 로그아웃 등: 서명이 검증된 액세스 토큰에서 subject(userId)를 추출합니다. 만료 토큰도 허용합니다. */
    public Optional<String> resolveUserIdFromAccessToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        try {
            Claims claims =
                    Jwts.parser()
                            .verifyWith(accessKey)
                            .build()
                            .parseSignedClaims(token)
                            .getPayload();
            return Optional.ofNullable(claims.getSubject());
        } catch (ExpiredJwtException e) {
            return Optional.ofNullable(e.getClaims().getSubject());
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("액세스 토큰 파싱 실패");
            return Optional.empty();
        }
    }

    public String getUserIdFromRefreshToken(String token) {
        return parseClaims(token, refreshKey).getSubject();
    }

    public LocalDateTime getRefreshTokenExpiration(String token) {
        return parseClaims(token, refreshKey)
                .getExpiration()
                .toInstant()
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    public boolean validateAccessToken(String token) {
        return validate(token, accessKey);
    }

    public boolean validateRefreshToken(String token) {
        return validate(token, refreshKey);
    }

    public void validateRefreshTokenOrThrow(String token) {
        try {
            parseClaims(token, refreshKey);
        } catch (ExpiredJwtException e) {
            log.warn("리프레시 토큰 만료");
            throw new CustomException(ErrorCode.EXPIRED_TOKEN);
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("리프레시 토큰 검증 실패");
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
    }

    private boolean validate(String token, SecretKey key) {
        try {
            parseClaims(token, key);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT 사용기간 만료");
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("JWT 검증 실패");
        }
        return false;
    }

    private Claims parseClaims(String token, SecretKey key) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}

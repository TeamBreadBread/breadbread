package com.breadbread.auth.service;

import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.global.config.JwtProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.jwt.JwtProvider;
import com.breadbread.user.entity.User;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class TokenService {
    private final JwtProvider jwtProvider;
    private final JwtProperties jwtProperties;
    private final RefreshTokenRedisService refreshTokenRedisService;

    public TokenResponse issueTokens(User user) {
        String userId = user.getId().toString();
        refreshTokenRedisService.deleteByUserId(userId);
        return generateTokens(userId);
    }

    public TokenResponse refresh(String refreshToken) {
        jwtProvider.validateRefreshTokenOrThrow(refreshToken);
        String hashedToken = hashToken(refreshToken);
        String userId =
                refreshTokenRedisService
                        .findUserIdByToken(hashedToken)
                        .orElseThrow(() -> new CustomException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        refreshTokenRedisService.deleteByToken(hashedToken);
        log.info("토큰 재발급 userId={}", userId);
        return generateTokens(userId);
    }

    public void logout(String accessToken) {
        String userId = jwtProvider.getUserIdFromAccessToken(accessToken);
        refreshTokenRedisService.deleteByUserId(userId);
        log.info("로그아웃 userId={}", userId);
    }

    private TokenResponse generateTokens(String userId) {
        String accessToken = jwtProvider.createAccessToken(userId);
        String refreshToken = jwtProvider.createRefreshToken(userId);
        refreshTokenRedisService.save(
                hashToken(refreshToken), userId, jwtProperties.getRefreshExpiresIn());

        return TokenResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new CustomException(ErrorCode.INTERNAL_SERVER_ERROR);
        }
    }
}

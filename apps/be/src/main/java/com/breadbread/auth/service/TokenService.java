package com.breadbread.auth.service;

import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.auth.entity.RefreshToken;
import com.breadbread.auth.repository.RefreshTokenRepository;
import com.breadbread.global.jwt.JwtProvider;
import com.breadbread.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class TokenService {
    private final JwtProvider jwtProvider;
    private final RefreshTokenRepository refreshTokenRepository;

    @Transactional
    public TokenResponse issueTokens(User user) {
        refreshTokenRepository.deleteByUser_Id(user.getId());
        return generateTokens(user);
    }

    @Transactional
    public TokenResponse refresh(String refreshToken) {
        if (!jwtProvider.validateRefreshToken(refreshToken)) {
            throw new RuntimeException("RefreshToken 유효하지 않음");
        }
        RefreshToken token = refreshTokenRepository.findByToken(hashToken(refreshToken))
                .orElseThrow(() -> new RuntimeException("RefreshToken 없음"));
        if(token.getExpiredAt().isBefore(LocalDateTime.now())){
            throw new RuntimeException("RefreshToken 만료");
        }

        refreshTokenRepository.delete(token);

        return generateTokens(token.getUser());
    }

    private TokenResponse generateTokens(User user) {
        String userId = user.getId().toString();
        String accessToken = jwtProvider.createAccessToken(userId);
        String refreshToken = jwtProvider.createRefreshToken(userId);

        refreshTokenRepository.save(RefreshToken.builder()
                .user(user)
                .token(hashToken(refreshToken))
                .expiredAt(jwtProvider.getRefreshTokenExpiration(refreshToken))
                .build());

        return TokenResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .build();
    }

    @Transactional
    public void logout(String accessToken) {
        String extractedUserId = jwtProvider.getUserIdFromAccessToken(accessToken);
        Long userId;
        try {
            userId = Long.parseLong(extractedUserId);
        } catch (NumberFormatException e) {
            throw new RuntimeException("AccessToken userId 형식이 올바르지 않음", e);
        }
        refreshTokenRepository.deleteByUser_Id(userId);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("토큰 해싱 실패", e);
        }
    }
}

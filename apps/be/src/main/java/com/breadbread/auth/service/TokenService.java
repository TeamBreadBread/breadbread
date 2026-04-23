package com.breadbread.auth.service;

import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.auth.entity.RefreshToken;
import com.breadbread.auth.repository.RefreshTokenRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.jwt.JwtProvider;
import com.breadbread.user.entity.User;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
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
            throw new CustomException(ErrorCode.INVALID_TOKEN);
        }
        RefreshToken token = refreshTokenRepository.findByToken(hashToken(refreshToken))
                .orElseThrow(() -> new CustomException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

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
        Long userId = Long.parseLong(extractedUserId);
        refreshTokenRepository.deleteByUser_Id(userId);
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

package com.breadbread.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.global.config.JwtProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.jwt.JwtProvider;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TokenServiceTest {

    @Mock private JwtProvider jwtProvider;
    @Mock private JwtProperties jwtProperties;
    @Mock private RefreshTokenRedisService refreshTokenRedisService;

    @InjectMocks private TokenService tokenService;

    @Test
    void issueTokens_rotates_refresh_whenIssuingForUser() {
        when(jwtProperties.getRefreshExpiresIn()).thenReturn(3600L);
        User user = user(42L);
        when(jwtProvider.createAccessToken("42")).thenReturn("access-42");
        when(jwtProvider.createRefreshToken("42")).thenReturn("refresh-raw");

        TokenResponse response = tokenService.issueTokens(user);

        assertThat(response.getAccessToken()).isEqualTo("access-42");
        assertThat(response.getRefreshToken()).isEqualTo("refresh-raw");
        verify(refreshTokenRedisService).deleteByUserId("42");
        ArgumentCaptor<String> hashCaptor = ArgumentCaptor.forClass(String.class);
        verify(refreshTokenRedisService).save(hashCaptor.capture(), eq("42"), eq(3600L));
        assertThat(hashCaptor.getValue()).isEqualTo(sha256Base64("refresh-raw"));
    }

    @Test
    void refresh_reissuesTokens_whenStoredHashMatches() {
        when(jwtProperties.getRefreshExpiresIn()).thenReturn(3600L);
        String refreshRaw = "old-refresh";
        String hashed = sha256Base64(refreshRaw);
        when(refreshTokenRedisService.findUserIdByToken(hashed)).thenReturn(Optional.of("7"));
        when(jwtProvider.createAccessToken("7")).thenReturn("new-access");
        when(jwtProvider.createRefreshToken("7")).thenReturn("new-refresh");

        TokenResponse response = tokenService.refresh(refreshRaw);

        assertThat(response.getAccessToken()).isEqualTo("new-access");
        verify(refreshTokenRedisService).deleteByToken(hashed);
        verify(refreshTokenRedisService).save(sha256Base64("new-refresh"), "7", 3600L);
    }

    @Test
    void refresh_throws_whenTokenNotInRedis() {
        String hashed = sha256Base64("unknown");
        when(refreshTokenRedisService.findUserIdByToken(hashed)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tokenService.refresh("unknown"))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.REFRESH_TOKEN_NOT_FOUND);
    }

    @Test
    void logout_clears_refresh_whenAccessTokenGiven() {
        when(jwtProvider.getUserIdFromAccessToken("access")).thenReturn("99");

        tokenService.logout("access");

        verify(refreshTokenRedisService).deleteByUserId("99");
    }

    private static String sha256Base64(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static User user(long id) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n")
                        .nickname("nick")
                        .email("e@t.com")
                        .phone("01012345678")
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }
}

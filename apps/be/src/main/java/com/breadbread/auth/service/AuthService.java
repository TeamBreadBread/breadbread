package com.breadbread.auth.service;

import com.breadbread.auth.repository.RefreshTokenRepository;
import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.auth.dto.LoginRequest;
import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.auth.entity.RefreshToken;
import com.breadbread.global.jwt.JwtProvider;
import com.breadbread.auth.dto.SignupRequest;
import com.breadbread.user.entity.User;
import com.breadbread.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final AuthenticationManager authenticationManager;
    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public String signup(SignupRequest signupRequest) {
        if(userRepository.findByLoginId(signupRequest.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }
        String encodedPassword = passwordEncoder.encode(signupRequest.getPassword());
        User user = User.builder()
                .loginId(signupRequest.getLoginId())
                .password(encodedPassword)
                .name(signupRequest.getName())
                .nickname(signupRequest.getName() + new Random().nextInt(100) + 1)  // 추후 수정 필요
                .email(signupRequest.getEmail())
                .phone(signupRequest.getPhone())
                .role(signupRequest.getRole())
                .privacyAgreed(signupRequest.isPrivacyAgreed())
                .termsAgreed(signupRequest.isTermsAgreed())
                .build();
        userRepository.save(user);
        return "회원가입이 완료되었습니다.";
    }

    @Transactional
    public TokenResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByLoginId(loginRequest.getLoginId()).orElseThrow();

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getId().toString(),
                        loginRequest.getPassword()
                )
        );
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();

        String accessToken = jwtProvider.createAccessToken(userDetails.getUsername());
        String refreshToken = jwtProvider.createRefreshToken(userDetails.getUsername());

        refreshTokenRepository.deleteByUser_Id(user.getId());
        RefreshToken rt = RefreshToken.builder()
                .user(user)
                .token(hashToken(refreshToken))
                .expiredAt(jwtProvider.getRefrehTokenExpiration(refreshToken))
                .build();

        refreshTokenRepository.save(rt);

        return TokenResponse.builder().accessToken(accessToken).refreshToken(refreshToken).build();
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

        String userId = token.getUser().getId().toString();
        String newAccessToken = jwtProvider.createAccessToken(userId);
        String newRefreshToken = jwtProvider.createRefreshToken(userId);

        RefreshToken newRt = RefreshToken.builder()
                .user(token.getUser())
                .token(hashToken(newRefreshToken))
                .expiredAt(jwtProvider.getRefrehTokenExpiration(newRefreshToken))
                .build();
        refreshTokenRepository.save(newRt);

        return TokenResponse.builder().accessToken(newAccessToken).refreshToken(newRefreshToken).build();
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes( StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("토큰 해싱 실패", e);
        }
    }
}

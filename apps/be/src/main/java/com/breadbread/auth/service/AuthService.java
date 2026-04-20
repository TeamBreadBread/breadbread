package com.breadbread.auth.service;

import com.breadbread.auth.dto.*;
import com.breadbread.auth.entity.*;
import com.breadbread.auth.repository.PhoneVerificationRepository;
import com.breadbread.global.util.SmsUtil;
import com.breadbread.user.entity.User;
import com.breadbread.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Random;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
    private final PhoneVerificationRepository phoneVerificationRepository;
    private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final SmsUtil smsUtil;
    private final SsoService ssoService;
    private final TokenService tokenService;

    @Value("${coolsms.api.expires-in}")
    private long expiresIn;

    private static final Random RANDOM = new Random();

    @Transactional
    public String signup(SignupRequest signupRequest) {
        if(userRepository.findByLoginId(signupRequest.getLoginId()).isPresent()) {
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        }
        if(!signupRequest.getPassword().equals(signupRequest.getPasswordConfirm())) {
            throw new IllegalArgumentException("비밀번호와 비밀번호 확인이 일치하지 않습니다.");
        }
        PhoneVerification verification = phoneVerificationRepository.findByPhoneAndPurpose(signupRequest.getPhone(), VerificationPurpose.SIGNUP)
                .orElseThrow(() -> new IllegalArgumentException("휴대전화 인증이 필요합니다."));
        if (verification.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new IllegalArgumentException("인증이 만료되었습니다. 다시 인증해주세요.");
        }
        if(!verification.isVerified()){
            throw new IllegalArgumentException("휴대전화 인증이 완료되지 않았습니다.");
        }
        String encodedPassword = passwordEncoder.encode(signupRequest.getPassword());
        User user = User.builder()
                .loginId(signupRequest.getLoginId())
                .password(encodedPassword)
                .name(signupRequest.getName())
                .nickname(signupRequest.getName() + (RANDOM.nextInt(100) + 1))  // 추후 수정 필요
                .email(signupRequest.getEmail())
                .phone(signupRequest.getPhone())
                .role(signupRequest.getRole())
                .privacyAgreed(signupRequest.isPrivacyAgreed())
                .termsAgreed(signupRequest.isTermsAgreed())
                .build();
        userRepository.save(user);
        phoneVerificationRepository.delete(verification);
        return "회원가입이 완료되었습니다.";
    }

    @Transactional
    public TokenResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByLoginId(loginRequest.getLoginId()).orElseThrow();

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        user.getId().toString(),
                        loginRequest.getPassword()
                )
        );

        return tokenService.issueTokens(user);
    }

    public void logout(String accessToken) {
        tokenService.logout(accessToken);
    }

    @Transactional
    public TokenResponse refresh(String refreshToken) {
        return tokenService.refresh(refreshToken);
    }

    @Transactional
    public void sendVerificationCode(SendPhoneRequest sendPhoneRequest) {
        phoneVerificationRepository.deleteByPhoneAndPurpose(sendPhoneRequest.getPhone(), sendPhoneRequest.getPurpose());

        String code = String.format("%06d", RANDOM.nextInt(1000000));
        PhoneVerification verification = PhoneVerification.builder()
                .phone(sendPhoneRequest.getPhone())
                .code(code)
                .expiredAt(LocalDateTime.now().plusSeconds(expiresIn))
                .authType(AuthType.SMS)
                .purpose(sendPhoneRequest.getPurpose())
                .build();
        phoneVerificationRepository.save(verification);

        smsUtil.sendSms(sendPhoneRequest.getPhone(), code);
        log.info("인증번호: {}", code); // 테스트용
    }

    @Transactional
    public String verifyCode(VerifyPhoneRequest verifyPhoneRequest) {
        PhoneVerification verification = phoneVerificationRepository.findByPhoneAndPurpose(verifyPhoneRequest.getPhone(), verifyPhoneRequest.getPurpose())
                .orElseThrow(() -> new RuntimeException("인증번호를 먼저 요청해주세요."));
        if (verification.isVerified()) {
            throw new RuntimeException("이미 인증된 번호입니다.");
        }
        if (verification.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("인증 코드가 만료되었습니다.");
        }
        if (!verification.getCode().equals(verifyPhoneRequest.getCode())) {
            throw new RuntimeException("인증 코드가 일치하지 않습니다.");
        }
        verification.verify();
        phoneVerificationRepository.save(verification);
        return "인증이 완료되었습니다.";
    }

    public TokenResponse socialLogin(SsoProvider provider, SocialLoginRequest request) {
        return ssoService.socialLogin(provider, request);
    }
}

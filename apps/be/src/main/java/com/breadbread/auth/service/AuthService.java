package com.breadbread.auth.service;

import com.breadbread.auth.dto.*;
import com.breadbread.auth.entity.*;
import com.breadbread.auth.repository.PhoneVerificationRepository;
import com.breadbread.global.util.SmsUtil;
import com.breadbread.auth.dto.CheckIdResponse;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
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
        PhoneVerification verification = validateVerificationToken(
                signupRequest.getVerificationToken(), VerificationPurpose.SIGNUP);
        if(!verification.getPhone().equals(signupRequest.getPhone())) {
            throw new IllegalArgumentException("인증된 휴대전화 번호와 입력한 번호가 일치하지 않습니다.");
        }
        String encodedPassword = passwordEncoder.encode(signupRequest.getPassword());
        User user = User.builder()
                .loginId(signupRequest.getLoginId())
                .password(encodedPassword)
                .name(signupRequest.getName())
                .nickname(signupRequest.getName() + (RANDOM.nextInt(100) + 1))  // 추후 수정 필요
                .email(signupRequest.getEmail())
                .phone(signupRequest.getPhone())
                .role(signupRequest.getRole() != null ? signupRequest.getRole() : UserRole.ROLE_USER)
                .privacyAgreed(signupRequest.isPrivacyAgreed())
                .termsAgreed(signupRequest.isTermsAgreed())
                .build();
        userRepository.save(user);
        phoneVerificationRepository.delete(verification);
        return "회원가입이 완료되었습니다.";
    }

    @Transactional
    public TokenResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByLoginId(loginRequest.getLoginId()).orElseThrow(
                () -> new RuntimeException("해당 아이디가 존재하지 않습니다.")
        );

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

    public CheckIdResponse checkId(String loginId) {
        boolean available = !userRepository.existsByLoginId(loginId);
        return CheckIdResponse.builder().available(available).build();
    }


    @Transactional
    public FindIdResponse findId(FindIdRequest findIdRequest) {
        PhoneVerification verification = validateVerificationToken(
                findIdRequest.getVerificationToken(), VerificationPurpose.FIND_ID);
        User user = userRepository.findByPhone(findIdRequest.getPhone())
                .orElseThrow(() -> new RuntimeException("해당 휴대전화 번호로 가입된 아이디가 없습니다."));
        if(!user.getName().equals(findIdRequest.getName()) || !user.getPhone().equals(verification.getPhone())) {
            throw new RuntimeException("사용자 정보가 일치하지 않습니다.");
        }
        phoneVerificationRepository.delete(verification);
        return FindIdResponse.builder().loginId(user.getLoginId()).build();
    }

    @Transactional
    public void findPassword(FindPwRequest findPwRequest) {
        PhoneVerification verification = validateVerificationToken(findPwRequest.getVerificationToken(), VerificationPurpose.FIND_PW);
        User user = userRepository.findByLoginId(findPwRequest.getLoginId())
                .orElseThrow(() -> new RuntimeException("해당 아이디가 존재하지 않습니다."));
        if(!user.getName().equals(findPwRequest.getName()) || !user.getPhone().equals(verification.getPhone())) {
            throw new RuntimeException("사용자 정보가 일치하지 않습니다.");
        }
    }

    @Transactional
    public void resetPassword(ResetPwRequest resetPwRequest) {
        PhoneVerification verification = validateVerificationToken(
                resetPwRequest.getVerificationToken(), VerificationPurpose.FIND_PW);
        User user = userRepository.findByPhone(verification.getPhone())
                .orElseThrow(() -> new RuntimeException("해당 정보를 찾을 수 없습니다."));
        if(!resetPwRequest.getNewPassword().equals(resetPwRequest.getNewPasswordConfirm())) {
            throw new RuntimeException("새 비밀번호와 새 비밀번호 확인이 일치하지 않습니다.");
        }
        user.updatePassword(passwordEncoder.encode(resetPwRequest.getNewPassword()));
        userRepository.save(user);
        phoneVerificationRepository.delete(verification);
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
    public VerifyPhoneResponse verifyCode(VerifyPhoneRequest verifyPhoneRequest) {
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
        String verificationToken = verification.verify();
        phoneVerificationRepository.save(verification);
        return VerifyPhoneResponse.builder().verificationToken(verificationToken).build();
    }

    public TokenResponse socialLogin(SsoProvider provider, SocialLoginRequest request) {
        return ssoService.socialLogin(provider, request);
    }

    private PhoneVerification validateVerificationToken(String token, VerificationPurpose purpose) {
        PhoneVerification verification = phoneVerificationRepository.findByVerificationToken(token)
                .orElseThrow(() -> new RuntimeException("유효하지 않은 인증 토큰입니다."));
        if (verification.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("인증이 만료되었습니다. 다시 인증해주세요.");
        }
        if (verification.getPurpose() != purpose) {
            throw new RuntimeException("올바르지 않은 인증 토큰입니다.");
        }
        return verification;
    }

    @Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
    public void deleteExpiredVerifications() {
        phoneVerificationRepository.deleteByExpiredAtBefore(LocalDateTime.now());
    }
}

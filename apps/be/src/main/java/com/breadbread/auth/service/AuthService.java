package com.breadbread.auth.service;

import com.breadbread.auth.dto.*;
import com.breadbread.auth.entity.*;
import com.breadbread.auth.repository.PhoneVerificationRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
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
    public void signup(SignupRequest signupRequest) {
        if(userRepository.findByLoginId(signupRequest.getLoginId()).isPresent()) {
            throw new CustomException(ErrorCode.DUPLICATE_LOGIN_ID);
        }
        if(!signupRequest.getPassword().equals(signupRequest.getPasswordConfirm())) {
            throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
        }
        PhoneVerification verification = validateVerificationToken(
                signupRequest.getVerificationToken(), VerificationPurpose.SIGNUP);
        if(!verification.getPhone().equals(signupRequest.getPhone())) {
            throw new CustomException(ErrorCode.PHONE_VERIFICATION_MISMATCH);
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
    }

    @Transactional
    public TokenResponse login(LoginRequest loginRequest) {
        User user = userRepository.findByLoginId(loginRequest.getLoginId()).orElseThrow(
                () -> new CustomException(ErrorCode.INVALID_LOGIN_ID)
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
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if(!user.getName().equals(findIdRequest.getName()) || !user.getPhone().equals(verification.getPhone())) {
            throw new CustomException(ErrorCode.USER_INFO_MISMATCH);
        }
        phoneVerificationRepository.delete(verification);
        return FindIdResponse.builder().loginId(user.getLoginId()).build();
    }

    @Transactional
    public void findPassword(FindPwRequest findPwRequest) {
        PhoneVerification verification = validateVerificationToken(findPwRequest.getVerificationToken(), VerificationPurpose.FIND_PW);
        User user = userRepository.findByLoginId(findPwRequest.getLoginId())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if(!user.getName().equals(findPwRequest.getName()) || !user.getPhone().equals(verification.getPhone())) {
            throw new CustomException(ErrorCode.USER_INFO_MISMATCH);
        }
    }

    @Transactional
    public void resetPassword(ResetPwRequest resetPwRequest) {
        PhoneVerification verification = validateVerificationToken(
                resetPwRequest.getVerificationToken(), VerificationPurpose.FIND_PW);
        User user = userRepository.findByPhone(verification.getPhone())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if(!resetPwRequest.getNewPassword().equals(resetPwRequest.getNewPasswordConfirm())) {
            throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
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
                .orElseThrow(() -> new CustomException(ErrorCode.VERIFICATION_NOT_FOUND));
        if (verification.isVerified()) {
            throw new CustomException(ErrorCode.ALREADY_VERIFIED);
        }
        if (verification.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.VERIFICATION_EXPIRED);
        }
        if (!verification.getCode().equals(verifyPhoneRequest.getCode())) {
            throw new CustomException(ErrorCode.INVALID_VERIFICATION_CODE);
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
                .orElseThrow(() -> new CustomException(ErrorCode.VERIFICATION_NOT_FOUND));
        if (verification.getExpiredAt().isBefore(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.VERIFICATION_EXPIRED);
        }
        if (verification.getPurpose() != purpose) {
            throw new CustomException(ErrorCode.VERIFICATION_PURPOSE_MISMATCH);
        }
        return verification;
    }

    @Scheduled(cron = "0 0 3 * * *") // 매일 새벽 3시
    public void deleteExpiredVerifications() {
        phoneVerificationRepository.deleteByExpiredAtBefore(LocalDateTime.now());
    }
}

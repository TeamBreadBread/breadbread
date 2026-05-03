package com.breadbread.auth.service;

import com.breadbread.auth.dto.*;
import com.breadbread.auth.entity.*;
import com.breadbread.auth.redis.PhoneVerificationCache;
import com.breadbread.auth.config.PhoneVerificationProperties;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.util.NicknameGenerator;
import com.breadbread.auth.util.SmsUtil;
import com.breadbread.auth.dto.CheckIdResponse;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Random;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {
    private final UserRepository userRepository;
	private final PhoneVerificationRedisService phoneVerificationRedisService;
	private final AuthenticationManager authenticationManager;
    private final PasswordEncoder passwordEncoder;
    private final SmsUtil smsUtil;
    private final SsoService ssoService;
    private final TokenService tokenService;
    private final NicknameGenerator nicknameGenerator;
    private final PhoneVerificationProperties phoneVerificationProperties;

    private static final Random RANDOM = new Random();

    @Transactional
    public void signup(SignupRequest signupRequest) {
        if(userRepository.findByLoginId(signupRequest.getLoginId()).isPresent()) {
            throw new CustomException(ErrorCode.DUPLICATE_LOGIN_ID);
        }
        if(!signupRequest.getPassword().equals(signupRequest.getPasswordConfirm())) {
            throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
        }
		if (userRepository.existsByPhone(signupRequest.getPhone())) {
			throw new CustomException(ErrorCode.DUPLICATE_PHONE);
		}
		PhoneVerificationCache verification = validateVerificationToken(
			signupRequest.getVerificationToken(),
			VerificationPurpose.SIGNUP
		);
		if(!verification.getPhone().equals(signupRequest.getPhone())) {
            throw new CustomException(ErrorCode.PHONE_VERIFICATION_MISMATCH);
        }
        String encodedPassword = passwordEncoder.encode(signupRequest.getPassword());
        User user = User.builder()
                .loginId(signupRequest.getLoginId())
                .password(encodedPassword)
                .name(signupRequest.getName())
                .nickname(generateUniqueNickname())
                .email(signupRequest.getEmail())
                .phone(signupRequest.getPhone())
                .role(signupRequest.getRole() != null ? signupRequest.getRole() : UserRole.ROLE_USER)
                .privacyAgreed(signupRequest.isPrivacyAgreed())
                .termsAgreed(signupRequest.isTermsAgreed())
                .build();
        userRepository.save(user);
		phoneVerificationRedisService.deleteByVerificationToken(signupRequest.getVerificationToken());
		log.info("회원가입 완료 loginId={}", signupRequest.getLoginId());
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
        log.info("로그인 성공 userId={}", user.getId());
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
		PhoneVerificationCache verification = validateVerificationToken(
			findIdRequest.getVerificationToken(),
			VerificationPurpose.FIND_ID
		);
        User user = userRepository.findByPhone(findIdRequest.getPhone())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if(!user.getName().equals(findIdRequest.getName()) || !user.getPhone().equals(verification.getPhone())) {
            throw new CustomException(ErrorCode.USER_INFO_MISMATCH);
        }
		phoneVerificationRedisService.deleteByVerificationToken(findIdRequest.getVerificationToken());

		return FindIdResponse.builder().loginId(user.getLoginId()).build();
    }

    @Transactional
    public void findPassword(FindPwRequest findPwRequest) {
		PhoneVerificationCache verification = validateVerificationToken(
			findPwRequest.getVerificationToken(),
			VerificationPurpose.FIND_PW
		);
        User user = userRepository.findByLoginId(findPwRequest.getLoginId())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if(!user.getName().equals(findPwRequest.getName()) || !user.getPhone().equals(verification.getPhone())) {
            throw new CustomException(ErrorCode.USER_INFO_MISMATCH);
        }
    }

    @Transactional
    public void resetPassword(ResetPwRequest resetPwRequest) {
		PhoneVerificationCache verification = validateVerificationToken(
			resetPwRequest.getVerificationToken(),
			VerificationPurpose.FIND_PW
		);
        User user = userRepository.findByPhone(verification.getPhone())
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if(!resetPwRequest.getNewPassword().equals(resetPwRequest.getNewPasswordConfirm())) {
            throw new CustomException(ErrorCode.PASSWORD_MISMATCH);
        }
        user.updatePassword(passwordEncoder.encode(resetPwRequest.getNewPassword()));
        userRepository.save(user);
		phoneVerificationRedisService.deleteByVerificationToken(resetPwRequest.getVerificationToken());

		log.info("비밀번호 재설정 완료 userId={}", user.getId());
    }

	public void sendVerificationCode(SendPhoneRequest sendPhoneRequest) {
		phoneVerificationRedisService.deleteByPhoneAndPurpose(
			sendPhoneRequest.getPhone(),
			sendPhoneRequest.getPurpose()
		);

        String code = String.format("%06d", RANDOM.nextInt(1000000));
		phoneVerificationRedisService.savePending(
			sendPhoneRequest.getPhone(),
			sendPhoneRequest.getPurpose(),
			code,
			phoneVerificationProperties.getCodeExpiresIn()
		);

        log.info("인증번호 발송 phone={} purpose={}", maskPhone(sendPhoneRequest.getPhone()), sendPhoneRequest.getPurpose());
        smsUtil.sendSms(sendPhoneRequest.getPhone(), code);
    }

	public VerifyPhoneResponse verifyCode(VerifyPhoneRequest verifyPhoneRequest) {
		PhoneVerificationCache verification = phoneVerificationRedisService
			.findByPhoneAndPurpose(verifyPhoneRequest.getPhone(), verifyPhoneRequest.getPurpose())
			.orElseThrow(() -> new CustomException(ErrorCode.VERIFICATION_NOT_FOUND));
        if (verification.isVerified()) {
            throw new CustomException(ErrorCode.ALREADY_VERIFIED);
        }
		if (!verification.getCode().equals(verifyPhoneRequest.getCode())) {
			throw new CustomException(ErrorCode.INVALID_VERIFICATION_CODE);
		}
		String verificationToken = UUID.randomUUID().toString();
		phoneVerificationRedisService.markVerified(
			verifyPhoneRequest.getPhone(),
			verifyPhoneRequest.getPurpose(),
			verificationToken,
			phoneVerificationProperties.getTokenExpiresIn()
		);
        log.info("휴대전화 인증 완료 phone={} purpose={}", maskPhone(verifyPhoneRequest.getPhone()), verifyPhoneRequest.getPurpose());
        return VerifyPhoneResponse.builder().verificationToken(verificationToken).build();
    }

    public TokenResponse socialLogin(SsoProvider provider, SocialLoginRequest request) {
        return ssoService.socialLogin(provider, request);
    }

    private PhoneVerificationCache validateVerificationToken(String token, VerificationPurpose purpose) {
		PhoneVerificationCache verification = phoneVerificationRedisService.findByVerificationToken(token)
			.orElseThrow(() -> new CustomException(ErrorCode.VERIFICATION_NOT_FOUND));
		if (verification.getPurpose() != purpose) {
			throw new CustomException(ErrorCode.VERIFICATION_PURPOSE_MISMATCH);
		}
		if (!verification.isVerified()) {
			log.warn("미인증 verification token 사용 시도 purpose={}", purpose);
			throw new CustomException(ErrorCode.VERIFICATION_NOT_FOUND);
		}
        return verification;
    }

    private String generateUniqueNickname() {
        String nickname;
        do {
            nickname = nicknameGenerator.generate();
        } while (userRepository.existsByNickname(nickname));
        return nickname;
    }

    private String maskPhone(String phone) {
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}

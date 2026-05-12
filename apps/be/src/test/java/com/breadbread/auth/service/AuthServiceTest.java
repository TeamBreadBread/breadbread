package com.breadbread.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import com.breadbread.auth.config.PhoneVerificationProperties;
import com.breadbread.auth.dto.CheckIdResponse;
import com.breadbread.auth.dto.FindIdRequest;
import com.breadbread.auth.dto.FindIdResponse;
import com.breadbread.auth.dto.FindPwRequest;
import com.breadbread.auth.dto.LoginRequest;
import com.breadbread.auth.dto.ResetPwRequest;
import com.breadbread.auth.dto.SendPhoneRequest;
import com.breadbread.auth.dto.SignupRequest;
import com.breadbread.auth.dto.SocialLoginRequest;
import com.breadbread.auth.dto.TokenResponse;
import com.breadbread.auth.dto.VerifyPhoneRequest;
import com.breadbread.auth.dto.VerifyPhoneResponse;
import com.breadbread.auth.entity.SsoProvider;
import com.breadbread.auth.entity.VerificationPurpose;
import com.breadbread.auth.redis.PhoneVerificationCache;
import com.breadbread.auth.util.SmsUtil;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.util.NicknameGenerator;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private UserRepository userRepository;

    @Mock private PhoneVerificationRedisService phoneVerificationRedisService;

    @Mock private AuthenticationManager authenticationManager;

    @Mock private PasswordEncoder passwordEncoder;

    @Mock private SmsUtil smsUtil;

    @Mock private SsoService ssoService;

    @Mock private TokenService tokenService;

    @Mock private NicknameGenerator nicknameGenerator;

    @Mock private PhoneVerificationProperties phoneVerificationProperties;

    @InjectMocks private AuthService authService;

    @Test
    void signup_savesUser_whenVerificationIsValid() {
        SignupRequest request =
                signupRequest(
                        " BreadUser123 ", "01012345678", UserRole.ROLE_USER, "verified-token");
        PhoneVerificationCache verification =
                verifiedCache("01012345678", VerificationPurpose.SIGNUP, "verified-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);
        when(userRepository.existsByPhone("01012345678")).thenReturn(false);
        when(userRepository.existsByNickname("bread-nickname")).thenReturn(false);
        when(phoneVerificationRedisService.findByVerificationToken("verified-token"))
                .thenReturn(Optional.of(verification));
        when(passwordEncoder.encode("Bread123!")).thenReturn("encoded-password");
        when(nicknameGenerator.generate()).thenReturn("bread-nickname");

        authService.signup(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        verify(phoneVerificationRedisService).deleteByVerificationToken("verified-token");

        User savedUser = userCaptor.getValue();
        assertThat(savedUser.getLoginId()).isEqualTo("breaduser123");
        assertThat(savedUser.getPassword()).isEqualTo("encoded-password");
        assertThat(savedUser.getNickname()).isEqualTo("bread-nickname");
        assertThat(savedUser.getPhone()).isEqualTo("01012345678");
        assertThat(savedUser.getRole()).isEqualTo(UserRole.ROLE_USER);
    }

    @Test
    void signup_defaultsRoleToUser_whenRoleIsNull() {
        SignupRequest request =
                signupRequest("BreadUser123", "01012345678", null, "verified-token");
        PhoneVerificationCache verification =
                verifiedCache("01012345678", VerificationPurpose.SIGNUP, "verified-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);
        when(userRepository.existsByPhone("01012345678")).thenReturn(false);
        when(userRepository.existsByNickname("bread-nickname")).thenReturn(false);
        when(phoneVerificationRedisService.findByVerificationToken("verified-token"))
                .thenReturn(Optional.of(verification));
        when(passwordEncoder.encode("Bread123!")).thenReturn("encoded-password");
        when(nicknameGenerator.generate()).thenReturn("bread-nickname");

        authService.signup(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertThat(userCaptor.getValue().getRole()).isEqualTo(UserRole.ROLE_USER);
    }

    @Test
    void signup_throws_whenLoginIdAlreadyExists() {
        SignupRequest request =
                signupRequest("breaduser123", "01012345678", UserRole.ROLE_USER, "verified-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_LOGIN_ID);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void signup_throws_whenPasswordConfirmationDoesNotMatch() {
        SignupRequest request =
                signupRequest("breaduser123", "01012345678", UserRole.ROLE_USER, "verified-token");
        ReflectionTestUtils.setField(request, "passwordConfirm", "Other123!");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PASSWORD_MISMATCH);

        verifyNoInteractions(phoneVerificationRedisService, passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void signup_throws_whenPhoneAlreadyExists() {
        SignupRequest request =
                signupRequest("breaduser123", "01012345678", UserRole.ROLE_USER, "verified-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);
        when(userRepository.existsByPhone("01012345678")).thenReturn(true);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.DUPLICATE_PHONE);

        verifyNoInteractions(phoneVerificationRedisService, passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void signup_throws_whenAdminRoleIsRequested() {
        SignupRequest request =
                signupRequest("breaduser123", "01012345678", UserRole.ROLE_ADMIN, "verified-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);
        when(userRepository.existsByPhone("01012345678")).thenReturn(false);

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verifyNoInteractions(phoneVerificationRedisService, passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void signup_throws_whenVerifiedPhoneDoesNotMatchRequestPhone() {
        SignupRequest request =
                signupRequest("breaduser123", "01012345678", UserRole.ROLE_USER, "verified-token");
        PhoneVerificationCache verification =
                verifiedCache("01099999999", VerificationPurpose.SIGNUP, "verified-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);
        when(userRepository.existsByPhone("01012345678")).thenReturn(false);
        when(phoneVerificationRedisService.findByVerificationToken("verified-token"))
                .thenReturn(Optional.of(verification));

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PHONE_VERIFICATION_MISMATCH);

        verifyNoInteractions(passwordEncoder);
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void login_returns_tokens_when_credentials_valid() {
        LoginRequest request = new LoginRequest();
        ReflectionTestUtils.setField(request, "loginId", " BreadUser123 ");
        ReflectionTestUtils.setField(request, "password", "Bread123!");

        User user =
                User.builder()
                        .loginId("breaduser123")
                        .password("encoded-password")
                        .name("Bread User")
                        .nickname("bread-nickname")
                        .phone("01012345678")
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        TokenResponse tokenResponse =
                TokenResponse.builder()
                        .accessToken("access-token")
                        .refreshToken("refresh-token")
                        .build();

        when(userRepository.findByLoginIdIgnoreCase("breaduser123")).thenReturn(Optional.of(user));
        when(tokenService.issueTokens(user)).thenReturn(tokenResponse);

        TokenResponse result = authService.login(request);

        ArgumentCaptor<UsernamePasswordAuthenticationToken> authCaptor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(authCaptor.capture());
        assertThat(authCaptor.getValue().getPrincipal()).isEqualTo("1");
        assertThat(authCaptor.getValue().getCredentials()).isEqualTo("Bread123!");
        assertThat(result).isSameAs(tokenResponse);
    }

    @Test
    void checkId_returns_false_when_login_id_blank() {
        CheckIdResponse response = authService.checkId("   ");

        assertThat(response.isAvailable()).isFalse();
        verify(userRepository, never()).existsByLoginIdIgnoreCase(any());
    }

    @Test
    void findId_returns_login_id_when_user_info_matches_verification() {
        FindIdRequest request = new FindIdRequest();
        ReflectionTestUtils.setField(request, "name", "Bread User");
        ReflectionTestUtils.setField(request, "phone", "01012345678");
        ReflectionTestUtils.setField(request, "verificationToken", "find-id-token");

        PhoneVerificationCache verification =
                verifiedCache("01012345678", VerificationPurpose.FIND_ID, "find-id-token");
        User user =
                User.builder()
                        .loginId("breaduser123")
                        .name("Bread User")
                        .phone("01012345678")
                        .build();

        when(phoneVerificationRedisService.findByVerificationToken("find-id-token"))
                .thenReturn(Optional.of(verification));
        when(userRepository.findByPhone("01012345678")).thenReturn(Optional.of(user));

        FindIdResponse response = authService.findId(request);

        assertThat(response.getLoginId()).isEqualTo("breaduser123");
        verify(phoneVerificationRedisService).deleteByVerificationToken("find-id-token");
    }

    @Test
    void findPassword_passes_when_verification_matches_user() {
        FindPwRequest request = new FindPwRequest();
        ReflectionTestUtils.setField(request, "loginId", " BreadUser123 ");
        ReflectionTestUtils.setField(request, "name", "Bread User");
        ReflectionTestUtils.setField(request, "verificationToken", "find-pw-token");

        PhoneVerificationCache verification =
                verifiedCache("01012345678", VerificationPurpose.FIND_PW, "find-pw-token");
        User user =
                User.builder()
                        .loginId("breaduser123")
                        .name("Bread User")
                        .phone("01012345678")
                        .build();

        when(phoneVerificationRedisService.findByVerificationToken("find-pw-token"))
                .thenReturn(Optional.of(verification));
        when(userRepository.findByLoginIdIgnoreCase("breaduser123")).thenReturn(Optional.of(user));

        authService.findPassword(request);

        verify(userRepository).findByLoginIdIgnoreCase("breaduser123");
    }

    @Test
    void findPassword_throws_whenUserInfoDoesNotMatch() {
        FindPwRequest request = new FindPwRequest();
        ReflectionTestUtils.setField(request, "loginId", "breaduser123");
        ReflectionTestUtils.setField(request, "name", "Other User");
        ReflectionTestUtils.setField(request, "verificationToken", "find-pw-token");

        PhoneVerificationCache verification =
                verifiedCache("01012345678", VerificationPurpose.FIND_PW, "find-pw-token");
        User user =
                User.builder()
                        .loginId("breaduser123")
                        .name("Bread User")
                        .phone("01012345678")
                        .build();

        when(phoneVerificationRedisService.findByVerificationToken("find-pw-token"))
                .thenReturn(Optional.of(verification));
        when(userRepository.findByLoginIdIgnoreCase("breaduser123")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.findPassword(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_INFO_MISMATCH);
    }

    @Test
    void resetPassword_updates_password_when_verification_token_valid() {
        ResetPwRequest request = new ResetPwRequest();
        ReflectionTestUtils.setField(request, "newPassword", "NewPass123!");
        ReflectionTestUtils.setField(request, "newPasswordConfirm", "NewPass123!");
        ReflectionTestUtils.setField(request, "verificationToken", "reset-token");

        PhoneVerificationCache verification =
                verifiedCache("01012345678", VerificationPurpose.FIND_PW, "reset-token");
        User user =
                User.builder()
                        .loginId("breaduser123")
                        .password("old-password")
                        .name("Bread User")
                        .phone("01012345678")
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        when(phoneVerificationRedisService.findByVerificationToken("reset-token"))
                .thenReturn(Optional.of(verification));
        when(userRepository.findByPhone("01012345678")).thenReturn(Optional.of(user));
        when(passwordEncoder.encode("NewPass123!")).thenReturn("encoded-new-password");

        authService.resetPassword(request);

        assertThat(user.getPassword()).isEqualTo("encoded-new-password");
        verify(userRepository).save(user);
        verify(phoneVerificationRedisService).deleteByVerificationToken("reset-token");
    }

    @Test
    void sendVerificationCode_sends_sms_when_phone_requested() {
        SendPhoneRequest request = new SendPhoneRequest();
        ReflectionTestUtils.setField(request, "phone", "01012345678");
        ReflectionTestUtils.setField(request, "purpose", VerificationPurpose.SIGNUP);
        when(phoneVerificationProperties.getCodeExpiresIn()).thenReturn(180L);

        authService.sendVerificationCode(request);

        ArgumentCaptor<String> pendingCodeCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> smsCodeCaptor = ArgumentCaptor.forClass(String.class);
        verify(phoneVerificationRedisService)
                .deleteByPhoneAndPurpose("01012345678", VerificationPurpose.SIGNUP);
        verify(phoneVerificationRedisService)
                .savePending(
                        eq("01012345678"),
                        eq(VerificationPurpose.SIGNUP),
                        pendingCodeCaptor.capture(),
                        eq(180L));
        verify(smsUtil).sendSms(eq("01012345678"), smsCodeCaptor.capture());
        assertThat(pendingCodeCaptor.getValue()).isEqualTo(smsCodeCaptor.getValue());
        assertThat(pendingCodeCaptor.getValue()).matches("\\d{6}");
    }

    @Test
    void signup_throws_whenVerificationTokenNotFound() {
        SignupRequest request =
                signupRequest("breaduser123", "01012345678", UserRole.ROLE_USER, "bad-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);
        when(userRepository.existsByPhone("01012345678")).thenReturn(false);
        when(phoneVerificationRedisService.findByVerificationToken("bad-token"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VERIFICATION_NOT_FOUND);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void signup_throws_whenVerificationPurposeMismatch() {
        SignupRequest request =
                signupRequest("breaduser123", "01012345678", UserRole.ROLE_USER, "find-id-token");
        PhoneVerificationCache wrongPurpose =
                verifiedCache("01012345678", VerificationPurpose.FIND_ID, "find-id-token");

        when(userRepository.existsByLoginIdIgnoreCase("breaduser123")).thenReturn(false);
        when(userRepository.existsByPhone("01012345678")).thenReturn(false);
        when(phoneVerificationRedisService.findByVerificationToken("find-id-token"))
                .thenReturn(Optional.of(wrongPurpose));

        assertThatThrownBy(() -> authService.signup(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.VERIFICATION_PURPOSE_MISMATCH);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void resetPassword_throws_whenPasswordConfirmationDoesNotMatch() {
        ResetPwRequest request = new ResetPwRequest();
        ReflectionTestUtils.setField(request, "newPassword", "NewPass123!");
        ReflectionTestUtils.setField(request, "newPasswordConfirm", "Other123!");
        ReflectionTestUtils.setField(request, "verificationToken", "reset-token");

        PhoneVerificationCache verification =
                verifiedCache("01012345678", VerificationPurpose.FIND_PW, "reset-token");
        User user =
                User.builder()
                        .loginId("breaduser123")
                        .password("old-password")
                        .name("Bread User")
                        .phone("01012345678")
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        when(phoneVerificationRedisService.findByVerificationToken("reset-token"))
                .thenReturn(Optional.of(verification));
        when(userRepository.findByPhone("01012345678")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.resetPassword(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PASSWORD_MISMATCH);

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void verifyCode_throws_whenCodeMismatch() {
        VerifyPhoneRequest request = new VerifyPhoneRequest();
        ReflectionTestUtils.setField(request, "phone", "01012345678");
        ReflectionTestUtils.setField(request, "code", "999999");
        ReflectionTestUtils.setField(request, "purpose", VerificationPurpose.SIGNUP);

        PhoneVerificationCache cache =
                PhoneVerificationCache.builder()
                        .phone("01012345678")
                        .code("123456")
                        .purpose(VerificationPurpose.SIGNUP)
                        .verified(false)
                        .build();

        when(phoneVerificationRedisService.findByPhoneAndPurpose(
                        "01012345678", VerificationPurpose.SIGNUP))
                .thenReturn(Optional.of(cache));

        assertThatThrownBy(() -> authService.verifyCode(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_VERIFICATION_CODE);

        verify(phoneVerificationRedisService, never())
                .markVerified(any(), any(), any(), any(Long.class));
    }

    @Test
    void verifyCode_throws_whenAlreadyVerified() {
        VerifyPhoneRequest request = new VerifyPhoneRequest();
        ReflectionTestUtils.setField(request, "phone", "01012345678");
        ReflectionTestUtils.setField(request, "code", "123456");
        ReflectionTestUtils.setField(request, "purpose", VerificationPurpose.SIGNUP);

        PhoneVerificationCache cache =
                PhoneVerificationCache.builder()
                        .phone("01012345678")
                        .code("123456")
                        .purpose(VerificationPurpose.SIGNUP)
                        .verified(true)
                        .build();

        when(phoneVerificationRedisService.findByPhoneAndPurpose(
                        "01012345678", VerificationPurpose.SIGNUP))
                .thenReturn(Optional.of(cache));

        assertThatThrownBy(() -> authService.verifyCode(request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_VERIFIED);

        verify(phoneVerificationRedisService, never())
                .markVerified(any(), any(), any(), any(Long.class));
    }

    @Test
    void verifyCode_returns_token_when_code_matches() {
        VerifyPhoneRequest request = new VerifyPhoneRequest();
        ReflectionTestUtils.setField(request, "phone", "01012345678");
        ReflectionTestUtils.setField(request, "code", "123456");
        ReflectionTestUtils.setField(request, "purpose", VerificationPurpose.SIGNUP);

        PhoneVerificationCache cache =
                PhoneVerificationCache.builder()
                        .phone("01012345678")
                        .code("123456")
                        .purpose(VerificationPurpose.SIGNUP)
                        .verified(false)
                        .build();

        when(phoneVerificationRedisService.findByPhoneAndPurpose(
                        "01012345678", VerificationPurpose.SIGNUP))
                .thenReturn(Optional.of(cache));
        when(phoneVerificationProperties.getTokenExpiresIn()).thenReturn(600L);

        VerifyPhoneResponse response = authService.verifyCode(request);

        ArgumentCaptor<String> tokenCaptor = ArgumentCaptor.forClass(String.class);
        verify(phoneVerificationRedisService)
                .markVerified(
                        eq("01012345678"),
                        eq(VerificationPurpose.SIGNUP),
                        tokenCaptor.capture(),
                        eq(600L));
        assertThat(response.getVerificationToken()).isEqualTo(tokenCaptor.getValue());
    }

    @Test
    void logout_delegates_to_token_service_when_access_token_given() {
        authService.logout("access-token");

        verify(tokenService).logout("access-token");
    }

    @Test
    void refresh_delegates_to_token_service_when_refresh_token_given() {
        TokenResponse expected =
                TokenResponse.builder()
                        .accessToken("access-token")
                        .refreshToken("refresh-token")
                        .build();
        when(tokenService.refresh("refresh-token")).thenReturn(expected);

        TokenResponse result = authService.refresh("refresh-token");

        assertThat(result).isSameAs(expected);
    }

    @Test
    void socialLogin_returns_tokens_when_sso_succeeds() {
        SocialLoginRequest request = new SocialLoginRequest();
        TokenResponse expected =
                TokenResponse.builder()
                        .accessToken("access-token")
                        .refreshToken("refresh-token")
                        .build();
        when(ssoService.socialLogin(SsoProvider.KAKAO, request)).thenReturn(expected);

        TokenResponse result = authService.socialLogin(SsoProvider.KAKAO, request);

        assertThat(result).isSameAs(expected);
    }

    @Test
    void issueNaverState_returns_state_when_sso_issues() {
        when(ssoService.issueNaverState()).thenReturn("naver-state");

        String result = authService.issueNaverState();

        assertThat(result).isEqualTo("naver-state");
    }

    private SignupRequest signupRequest(
            String loginId, String phone, UserRole role, String verificationToken) {
        SignupRequest request = new SignupRequest();
        ReflectionTestUtils.setField(request, "loginId", loginId);
        ReflectionTestUtils.setField(request, "password", "Bread123!");
        ReflectionTestUtils.setField(request, "passwordConfirm", "Bread123!");
        ReflectionTestUtils.setField(request, "name", "Bread User");
        ReflectionTestUtils.setField(request, "email", "bread@example.com");
        ReflectionTestUtils.setField(request, "phone", phone);
        ReflectionTestUtils.setField(request, "role", role);
        ReflectionTestUtils.setField(request, "termsAgreed", true);
        ReflectionTestUtils.setField(request, "privacyAgreed", true);
        ReflectionTestUtils.setField(request, "verificationToken", verificationToken);
        return request;
    }

    private PhoneVerificationCache verifiedCache(
            String phone, VerificationPurpose purpose, String verificationToken) {
        return PhoneVerificationCache.builder()
                .phone(phone)
                .purpose(purpose)
                .verified(true)
                .verificationToken(verificationToken)
                .build();
    }
}

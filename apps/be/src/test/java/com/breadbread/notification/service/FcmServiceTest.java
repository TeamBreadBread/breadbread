package com.breadbread.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.notification.entity.FcmToken;
import com.breadbread.notification.repository.FcmTokenRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class FcmServiceTest {

    @Mock private FcmTokenRepository fcmTokenRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private FcmService fcmService;

    // ───────────────────────────── registerToken ─────────────────────────────

    @Test
    void registerToken_skips_whenTokenAlreadyExists() {
        when(fcmTokenRepository.existsByUserIdAndToken(1L, "token123")).thenReturn(true);

        fcmService.registerToken(1L, "token123");

        verify(fcmTokenRepository, never()).save(any());
    }

    @Test
    void registerToken_throws_whenUserNotFound() {
        when(fcmTokenRepository.existsByUserIdAndToken(1L, "token123")).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> fcmService.registerToken(1L, "token123"))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);

        verify(fcmTokenRepository, never()).save(any());
    }

    @Test
    void registerToken_saves_whenNewToken() {
        User user = user(1L);
        when(fcmTokenRepository.existsByUserIdAndToken(1L, "token123")).thenReturn(false);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        fcmService.registerToken(1L, "token123");

        ArgumentCaptor<FcmToken> captor = ArgumentCaptor.forClass(FcmToken.class);
        verify(fcmTokenRepository).save(captor.capture());
        assertThat(captor.getValue().getToken()).isEqualTo("token123");
        assertThat(captor.getValue().getUser()).isSameAs(user);
    }

    // ───────────────────────────── sendToUser ─────────────────────────────

    @Test
    void sendToUser_returns_whenNoTokens() {
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of());

        fcmService.sendToUser(1L, "제목", "내용", null);

        verify(fcmTokenRepository, never()).deleteByToken(any());
    }

    @Test
    void sendToUser_sendsMessage_whenTokenExists() throws Exception {
        FcmToken token = fcmToken("device-token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenReturn("message-id");

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            fcmService.sendToUser(1L, "제목", "내용", null);

            verify(mockMessaging).send(any(Message.class));
            verify(fcmTokenRepository, never()).deleteByToken(any());
        }
    }

    @Test
    void sendToUser_sendsMessage_withData() throws Exception {
        FcmToken token = fcmToken("device-token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenReturn("message-id");

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            fcmService.sendToUser(1L, "제목", "내용", Map.of("type", "AI_COURSE", "courseId", "42"));

            verify(mockMessaging).send(any(Message.class));
        }
    }

    @Test
    void sendToUser_deletesToken_whenUnregistered() throws Exception {
        FcmToken token = fcmToken("expired-token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

        FirebaseMessagingException exception =
                mockFirebaseException(MessagingErrorCode.UNREGISTERED);
        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenThrow(exception);

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            fcmService.sendToUser(1L, "제목", "내용", null);

            verify(fcmTokenRepository).deleteByToken("expired-token");
        }
    }

    @Test
    void sendToUser_deletesToken_whenInvalidArgument() throws Exception {
        FcmToken token = fcmToken("invalid-token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

        FirebaseMessagingException exception =
                mockFirebaseException(MessagingErrorCode.INVALID_ARGUMENT);
        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenThrow(exception);

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            fcmService.sendToUser(1L, "제목", "내용", null);

            verify(fcmTokenRepository).deleteByToken("invalid-token");
        }
    }

    @Test
    void sendToUser_skipsDelete_whenOtherFirebaseError() throws Exception {
        FcmToken token = fcmToken("token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

        FirebaseMessagingException exception = mockFirebaseException(MessagingErrorCode.INTERNAL);
        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenThrow(exception);

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            fcmService.sendToUser(1L, "제목", "내용", null);

            verify(fcmTokenRepository, never()).deleteByToken(any());
        }
    }

    @Test
    void sendToUser_continuesNextToken_whenOneFails() throws Exception {
        FcmToken token1 = fcmToken("token-fail");
        FcmToken token2 = fcmToken("token-ok");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token1, token2));

        FirebaseMessagingException exception = mockFirebaseException(MessagingErrorCode.INTERNAL);
        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenThrow(exception).thenReturn("message-id");

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            fcmService.sendToUser(1L, "제목", "내용", null);

            // 첫 번째 실패해도 두 번째 토큰으로 전송 시도
            verify(mockMessaging, org.mockito.Mockito.times(2)).send(any(Message.class));
        }
    }

    // ───────────────────────────── sendToUserSync ─────────────────────────────

    @Test
    void sendToUserSync_returns_false_whenNoTokens() {
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of());

        assertThat(fcmService.sendToUserSync(1L, "제목", "내용", null)).isFalse();
    }

    @Test
    void sendToUserSync_returns_true_whenSendSucceeds() throws Exception {
        FcmToken token = fcmToken("device-token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenReturn("msg-id");

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            assertThat(fcmService.sendToUserSync(1L, "제목", "내용", null)).isTrue();
        }
    }

    @Test
    void sendToUserSync_returns_true_whenPartialSuccess() throws Exception {
        FcmToken token1 = fcmToken("fail-token");
        FcmToken token2 = fcmToken("ok-token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token1, token2));

        FirebaseMessagingException exception = mockFirebaseException(MessagingErrorCode.INTERNAL);
        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenThrow(exception).thenReturn("msg-id");

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            assertThat(fcmService.sendToUserSync(1L, "제목", "내용", null)).isTrue();
        }
    }

    @Test
    void sendToUserSync_returns_false_whenAllFail() throws Exception {
        FcmToken token = fcmToken("token");
        when(fcmTokenRepository.findAllByUserId(1L)).thenReturn(List.of(token));

        FirebaseMessagingException exception = mockFirebaseException(MessagingErrorCode.INTERNAL);
        FirebaseMessaging mockMessaging = mock(FirebaseMessaging.class);
        when(mockMessaging.send(any(Message.class))).thenThrow(exception);

        try (MockedStatic<FirebaseMessaging> mocked = mockStatic(FirebaseMessaging.class)) {
            mocked.when(FirebaseMessaging::getInstance).thenReturn(mockMessaging);

            assertThat(fcmService.sendToUserSync(1L, "제목", "내용", null)).isFalse();
        }
    }

    // ───────────────────────────── helpers ─────────────────────────────

    private static User user(long id) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n" + id)
                        .nickname("nick" + id)
                        .email(id + "@t.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static FcmToken fcmToken(String token) {
        FcmToken fcmToken = FcmToken.builder().user(user(1L)).token(token).build();
        ReflectionTestUtils.setField(fcmToken, "id", 1L);
        return fcmToken;
    }

    private static FirebaseMessagingException mockFirebaseException(MessagingErrorCode errorCode) {
        FirebaseMessagingException exception = mock(FirebaseMessagingException.class);
        when(exception.getMessagingErrorCode()).thenReturn(errorCode);
        return exception;
    }
}

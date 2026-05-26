package com.breadbread.notification.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.notification.entity.FcmToken;
import com.breadbread.notification.repository.FcmTokenRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.repository.UserRepository;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmService {

    private final FcmTokenRepository fcmTokenRepository;
    private final UserRepository userRepository;

    @Transactional
    public void registerToken(Long userId, String token) {
        if (fcmTokenRepository.existsByUserIdAndToken(userId, token)) {
            log.info("FCM 토큰 이미 등록됨: userId={}", userId);
            return;
        }

        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        fcmTokenRepository.save(FcmToken.builder().user(user).token(token).build());
        log.info("FCM 토큰 등록 완료: userId={}", userId);
    }

    @Async
    public void sendToUser(Long userId, String title, String body, Map<String, String> data) {
        List<FcmToken> tokens = fcmTokenRepository.findAllByUserId(userId);

        if (tokens.isEmpty()) {
            log.info("FCM 전송 대상 토큰 없음: userId={}", userId);
            return;
        }

        log.info("FCM 전송 시작: userId={}, 토큰 수={}, title={}", userId, tokens.size(), title);

        for (FcmToken fcmToken : tokens) {
            String tokenSuffix = tokenSuffix(fcmToken.getToken());
            try {
                Message.Builder builder =
                        Message.builder()
                                .setNotification(
                                        Notification.builder()
                                                .setTitle(title)
                                                .setBody(body)
                                                .build())
                                .setToken(fcmToken.getToken());

                if (data != null && !data.isEmpty()) {
                    builder.putAllData(data);
                }

                String messageId = FirebaseMessaging.getInstance().send(builder.build());
                log.info(
                        "FCM 전송 성공: userId={}, token=...{}, messageId={}",
                        userId,
                        tokenSuffix,
                        messageId);
            } catch (FirebaseMessagingException e) {
                log.warn(
                        "FCM 전송 실패: userId={}, token=...{}, errorCode={}, message={}",
                        userId,
                        tokenSuffix,
                        e.getMessagingErrorCode(),
                        e.getMessage());
                if (e.getMessagingErrorCode() == MessagingErrorCode.UNREGISTERED
                        || e.getMessagingErrorCode() == MessagingErrorCode.INVALID_ARGUMENT) {
                    fcmTokenRepository.deleteByToken(fcmToken.getToken());
                    log.info("FCM 만료 토큰 삭제: userId={}, token=...{}", userId, tokenSuffix);
                }
            } catch (Exception e) {
                log.warn(
                        "FCM 전송 중 예상치 못한 오류: userId={}, token=...{}, error={}",
                        userId,
                        tokenSuffix,
                        e.getMessage());
            }
        }
    }

    private static String tokenSuffix(String token) {
        if (token == null || token.length() <= 8) return token;
        return token.substring(token.length() - 8);
    }
}

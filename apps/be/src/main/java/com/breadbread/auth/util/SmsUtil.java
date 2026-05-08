package com.breadbread.auth.util;

import com.breadbread.auth.config.CoolSmsProperties;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class SmsUtil {
    private final CoolSmsProperties coolSmsProperties;

    DefaultMessageService messageService;

    @PostConstruct
    private void init() {
        this.messageService =
                NurigoApp.INSTANCE.initialize(
                        coolSmsProperties.getKey(),
                        coolSmsProperties.getSecret(),
                        "https://api.coolsms.co.kr");
    }

    // 인증번호 전송 : 단일 메세지
    public SingleMessageSentResponse sendSms(String receiver, String code) {
        Message message = new Message();
        message.setFrom(coolSmsProperties.getSender());
        message.setTo(receiver);
        message.setText("[빵빵] 본인 확인 인증번호 : [" + code + "]");

        try {
            SingleMessageSentResponse response =
                    messageService.sendOne(new SingleMessageSendingRequest(message));
            log.info("SMS 발송 성공 phone={}", maskPhone(receiver));
            return response;
        } catch (Exception e) {
            log.error("SMS 발송 실패 phone={} error={}", maskPhone(receiver), e.getMessage());
            throw e;
        }
    }

    private String maskPhone(String phone) {
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }
}

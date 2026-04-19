package com.breadbread.global.util;

import jakarta.annotation.PostConstruct;
import net.nurigo.sdk.NurigoApp;
import net.nurigo.sdk.message.model.Message;
import net.nurigo.sdk.message.request.SingleMessageSendingRequest;
import net.nurigo.sdk.message.response.SingleMessageSentResponse;
import net.nurigo.sdk.message.service.DefaultMessageService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SmsUtil {
    @Value("${coolsms.api.key}")
    private String apiKey;

    @Value("${coolsms.api.secret}")
    private String secretKey;

    @Value("${coolsms.api.sender}")
    private String sender;

    DefaultMessageService messageService;

    @PostConstruct
    private void init() {
        this.messageService = NurigoApp.INSTANCE.initialize(apiKey, secretKey, "https://api.coolsms.co.kr");
    }

    // 인증번호 전송 : 단일 메세지
    public SingleMessageSentResponse sendSms(String receiver, String code) {
        Message message = new Message();
        message.setFrom(sender);
        message.setTo(receiver);
        message.setText("[빵빵] 본인 확인 인증번호 : [" + code + "]");

        return messageService.sendOne(new SingleMessageSendingRequest(message));
    }
}

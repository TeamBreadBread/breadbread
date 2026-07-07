package com.breadbread.global.exception;

import lombok.Getter;

/**
 * 외부 API의 일시적 장애(타임아웃, 연결 실패, 5xx)를 나타내는 예외. {@code @Retryable}이 재시도 대상으로 잡을 수 있도록 CustomException과
 * 분리했다. {@code @Recover}는 쓰지 않는다 — 재시도 대상이 아닌 예외까지 recovery를 타면서 매칭되는 핸들러가 없으면
 * ExhaustedRetryException으로 감싸버리는 문제가 있어서, 재시도 소진 시 원본 예외가 그대로 전파되도록 두고 {@link
 * GlobalExceptionHandler}에서 errorCode 기준으로 응답을 만든다.
 */
@Getter
public class TransientApiException extends RuntimeException {

    private final ErrorCode errorCode;

    public TransientApiException(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
}

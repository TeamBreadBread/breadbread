package com.breadbread.global.exception;

import com.breadbread.global.dto.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.InsufficientAuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // 커스텀 예외
    @ExceptionHandler(CustomException.class)
    public ApiResponse<Void> handleCustomException(CustomException e) {
        log.error("CustomException: {}", e.getMessage());
        ErrorCode errorCode = e.getErrorCode();
        return ApiResponse.fail(errorCode.getCode(), errorCode.getMessage());
    }

    // @Valid 어노테이션 유효성 검증 실패
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ApiResponse<Void> handleValidException(MethodArgumentNotValidException e) {
        log.warn("Validation failed: {}", e.getMessage());
        String message = e.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE.getCode(), message);
    }

    // enum 매핑 실패 (@PathVariable 등)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ApiResponse<?> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        log.warn("TypeMismatch: {}", e.getValue());
        return ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE.getCode(), "올바르지 않은 값입니다: " + e.getValue());
    }

    // 비밀번호 불일치 등 인증 실패
    @ExceptionHandler(BadCredentialsException.class)
    public ApiResponse<Void> handleBadCredentials(BadCredentialsException e) {
        log.warn("BadCredentials: {}", e.getMessage());
        return ApiResponse.fail(ErrorCode.INVALID_PASSWORD.getCode(), ErrorCode.INVALID_PASSWORD.getMessage());
    }

    // 잘못된 JSON 형식
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ApiResponse<Void> handleNotReadable(HttpMessageNotReadableException e) {
        log.warn("HttpMessageNotReadable: {}", e.getMessage());
        return ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE.getCode(), "올바르지 않은 요청 형식입니다.");
    }

    // 지원하지 않는 HTTP 메서드 (GET으로 POST API 호출 등)
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ApiResponse<Void> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        log.warn("HttpRequestMethodNotSupportedException: {}", e.getMessage());
        return ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE.getCode(), "지원하지 않는 HTTP 메서드입니다.");
    }

    // 그 외
    @ExceptionHandler(Exception.class)
    public ApiResponse<Void> handleException(Exception e) {
        log.error("Exception: {}", e.getMessage());
        return ApiResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR.getCode(), ErrorCode.INTERNAL_SERVER_ERROR.getMessage());
    }
}
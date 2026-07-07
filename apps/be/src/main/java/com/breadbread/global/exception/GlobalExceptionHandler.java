package com.breadbread.global.exception;

import com.breadbread.global.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
import java.util.EnumSet;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    /**
     * 외부 API 실패로 인한 5xx 에러코드. 원인(HTTP 상태/body)은 클라이언트 쪽에서 이미 로깅했으므로, 여기서는 스택트레이스 없이 메시지만 남긴다. 진짜 내부
     * 버그로 인한 5xx(INTERNAL_SERVER_ERROR 등)는 별도로 트레이스를 유지한다.
     */
    private static final Set<ErrorCode> EXTERNAL_API_ERROR_CODES =
            EnumSet.of(
                    ErrorCode.BAKERY_IMPORT_SEARCH_FAILED,
                    ErrorCode.ROUTE_PROVIDER_ERROR,
                    ErrorCode.AI_SERVER_ERROR,
                    ErrorCode.AI_WEBHOOK_HTTP_ERROR,
                    ErrorCode.AI_WEBHOOK_TIMEOUT,
                    ErrorCode.AI_WEBHOOK_CONNECTION_ERROR,
                    ErrorCode.AI_WEBHOOK_EMPTY_RESPONSE);

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
        ErrorCode errorCode = e.getErrorCode();
        MDC.put("errorCode", errorCode.getCode());
        try {
            if (errorCode.getStatus().is5xxServerError()
                    && !EXTERNAL_API_ERROR_CODES.contains(errorCode)) {
                log.error("[{}] {}", errorCode.getCode(), e.getMessage(), e);
            } else {
                log.warn("[{}] {}", errorCode.getCode(), e.getMessage());
            }
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.status(errorCode.getStatus()).body(ApiResponse.fail(errorCode));
    }

    /**
     * 재시도 대상 예외라 클라이언트 쪽 callApi가 시도마다 이미 트레이스를 남겼으므로, 여기서는 트레이스 없이 메시지만 남긴다(외부 API 문제라는 게 정의상
     * 확실하므로 별도 코드 목록으로 분기할 필요가 없다).
     */
    @ExceptionHandler(TransientApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleTransientApiException(TransientApiException e) {
        ErrorCode errorCode = e.getErrorCode();
        MDC.put("errorCode", errorCode.getCode());
        try {
            log.error("[{}] 재시도 소진: {}", errorCode.getCode(), e.getMessage());
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.status(errorCode.getStatus()).body(ApiResponse.fail(errorCode));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidException(
            MethodArgumentNotValidException e) {
        String message =
                e.getBindingResult().getFieldErrors().stream()
                        .map(error -> error.getField() + ": " + error.getDefaultMessage())
                        .collect(Collectors.joining(", "));
        MDC.put("errorCode", ErrorCode.INVALID_INPUT_VALUE.getCode());
        try {
            log.warn("Validation failed: {}", message);
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.badRequest()
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE.getCode(), message));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ApiResponse<Void>> handleTypeMismatch(
            MethodArgumentTypeMismatchException e) {
        MDC.put("errorCode", ErrorCode.INVALID_INPUT_VALUE.getCode());
        try {
            log.warn("TypeMismatch: {}", e.getValue());
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.badRequest()
                .body(
                        ApiResponse.fail(
                                ErrorCode.INVALID_INPUT_VALUE.getCode(),
                                "올바르지 않은 값입니다: " + e.getValue()));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Void>> handleConstraintViolation(
            ConstraintViolationException e) {
        String message =
                e.getConstraintViolations().stream()
                        .map(violation -> violation.getMessage())
                        .collect(Collectors.joining(", "));
        MDC.put("errorCode", ErrorCode.INVALID_INPUT_VALUE.getCode());
        try {
            log.warn("ConstraintViolation: {}", message);
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.badRequest()
                .body(ApiResponse.fail(ErrorCode.INVALID_INPUT_VALUE.getCode(), message));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException e) {
        MDC.put("errorCode", ErrorCode.INVALID_PASSWORD.getCode());
        try {
            log.warn("BadCredentials: {}", e.getMessage());
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.fail(ErrorCode.INVALID_PASSWORD));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotReadable(HttpMessageNotReadableException e) {
        MDC.put("errorCode", ErrorCode.INVALID_INPUT_VALUE.getCode());
        try {
            log.warn("HttpMessageNotReadable: {}", e.getMessage());
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.badRequest()
                .body(
                        ApiResponse.fail(
                                ErrorCode.INVALID_INPUT_VALUE.getCode(), "올바르지 않은 요청 형식입니다."));
    }

    @ExceptionHandler({NoHandlerFoundException.class, NoResourceFoundException.class})
    public ResponseEntity<ApiResponse<Void>> handleNotFound(Exception e) {
        MDC.put("errorCode", ErrorCode.NOT_FOUND.getCode());
        try {
            log.warn("Path not found: {}", e.getMessage());
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(ApiResponse.fail(ErrorCode.NOT_FOUND.getCode(), "존재하지 않는 경로입니다."));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ApiResponse<Void>> handleMethodNotSupported(
            HttpRequestMethodNotSupportedException e) {
        MDC.put("errorCode", ErrorCode.INVALID_INPUT_VALUE.getCode());
        try {
            log.warn("HttpRequestMethodNotSupportedException: {}", e.getMessage());
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
                .body(
                        ApiResponse.fail(
                                ErrorCode.INVALID_INPUT_VALUE.getCode(), "지원하지 않는 HTTP 메서드입니다."));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleException(Exception e) {
        MDC.put("errorCode", ErrorCode.INTERNAL_SERVER_ERROR.getCode());
        try {
            log.error("Unhandled exception", e);
        } finally {
            MDC.remove("errorCode");
        }
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(ApiResponse.fail(ErrorCode.INTERNAL_SERVER_ERROR));
    }
}

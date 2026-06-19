package com.breadbread.global.exception;

import com.breadbread.global.dto.ApiResponse;
import jakarta.validation.ConstraintViolationException;
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

    @ExceptionHandler(CustomException.class)
    public ResponseEntity<ApiResponse<Void>> handleCustomException(CustomException e) {
        ErrorCode errorCode = e.getErrorCode();
        MDC.put("errorCode", errorCode.getCode());
        try {
            if (errorCode.getStatus().is5xxServerError()) {
                log.error("[{}] {}", errorCode.getCode(), e.getMessage(), e);
            } else {
                log.warn("[{}] {}", errorCode.getCode(), e.getMessage());
            }
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

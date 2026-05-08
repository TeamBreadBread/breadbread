package com.breadbread.payment.controller;

import com.breadbread.auth.dto.CustomUserDetails;
import com.breadbread.global.dto.ApiResponse;
import com.breadbread.payment.dto.CompletePaymentRequest;
import com.breadbread.payment.dto.CompletePaymentResponse;
import com.breadbread.payment.dto.PaymentDetailResponse;
import com.breadbread.payment.dto.PreparePaymentRequest;
import com.breadbread.payment.dto.PreparePaymentResponse;
import com.breadbread.payment.service.PaymentService;
import io.portone.sdk.server.errors.WebhookVerificationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "결제")
@RestController
@RequestMapping("/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "결제 준비", description = "예약 ID와 결제 수단을 받아 포트원 SDK 초기화에 필요한 정보를 반환합니다.")
    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping("/prepare")
    public ApiResponse<PreparePaymentResponse> preparePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PreparePaymentRequest request) {
        return ApiResponse.ok(paymentService.preparePayment(userDetails.getId(), request));
    }

    @Operation(summary = "결제 완료 검증", description = "포트원 결제 완료 후 서버사이드 금액 검증 및 상태 업데이트를 수행합니다.")
    @PostMapping("/complete")
    public ApiResponse<CompletePaymentResponse> completePayment(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CompletePaymentRequest request) {
        return ApiResponse.ok(paymentService.completePayment(userDetails.getId(), request));
    }

    @Operation(summary = "결제 상세 조회 (관리자 전용)")
    @GetMapping("/{paymentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<PaymentDetailResponse> getPayment(
            @Parameter(description = "포트원 결제 ID", example = "63acc42e-a866-4f3e-b88e-2d269386226f")
                    @PathVariable
                    String paymentId) {
        return ApiResponse.ok(paymentService.getPayment(paymentId));
    }

    @SecurityRequirements
    @Operation(
            summary = "PortOne 결제 웹훅",
            description = "포트원 Standard Webhooks 서명 검증 후 결제 상태를 동기화합니다. 포트원 서버에서만 호출됩니다.")
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestBody String rawBody, HttpServletRequest request)
            throws WebhookVerificationException {
        paymentService.handleWebhook(rawBody, request);
        return ResponseEntity.ok().build();
    }
}

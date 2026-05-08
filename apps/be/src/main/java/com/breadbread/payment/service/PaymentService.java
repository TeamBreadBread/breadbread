package com.breadbread.payment.service;

import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.payment.client.PortOneClient;
import com.breadbread.payment.config.PortOneProperties;
import com.breadbread.payment.dto.CompletePaymentRequest;
import com.breadbread.payment.dto.CompletePaymentResponse;
import com.breadbread.payment.dto.PaymentDetailResponse;
import com.breadbread.payment.dto.PortOnePaymentResponse;
import com.breadbread.payment.dto.PreparePaymentRequest;
import com.breadbread.payment.dto.PreparePaymentResponse;
import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentStatus;
import com.breadbread.payment.entity.PgProvider;
import com.breadbread.payment.repository.PaymentRepository;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.portone.sdk.server.errors.WebhookVerificationException;
import io.portone.sdk.server.webhook.WebhookVerifier;
import jakarta.servlet.http.HttpServletRequest;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final PaymentRepository paymentRepository;
    private final PortOneClient portOneClient;
    private final PortOneProperties properties;
    private final ObjectMapper objectMapper;

    @Transactional
    public PreparePaymentResponse preparePayment(Long userId, PreparePaymentRequest request) {
        Reservation reservation =
                reservationRepository
                        .findById(request.getReservationId())
                        .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
        if (!reservation.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        String paymentId = UUID.randomUUID().toString();

        Payment payment =
                Payment.builder()
                        .paymentId(paymentId)
                        .pgProvider(PgProvider.TOSS_PAYMENT)
                        .originalAmount(reservation.getQuotedAmount())
                        .discountAmount(0L)
                        .finalAmount(reservation.getQuotedAmount())
                        .user(reservation.getUser())
                        .paymentMethod(request.getPaymentMethod())
                        .paymentMethodDetail(request.getPaymentMethodDetail())
                        .reservation(reservation)
                        .build();

        paymentRepository.save(payment);
        log.info("결제 준비: paymentId={}, reservationId={}", paymentId, request.getReservationId());

        return PreparePaymentResponse.from(payment);
    }

    @Transactional
    public CompletePaymentResponse completePayment(Long userId, CompletePaymentRequest request) {
        Payment payment =
                paymentRepository
                        .findByPaymentId(request.getPaymentId())
                        .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));
        userRepository
                .findById(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        if (!payment.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
        if (payment.getStatus() == PaymentStatus.PAID) {
            return CompletePaymentResponse.builder()
                    .paymentId(payment.getPaymentId())
                    .reservationId(payment.getReservation().getId())
                    .status(payment.getStatus())
                    .amount(payment.getFinalAmount())
                    .paidAt(payment.getPaidAt())
                    .build();
        }

        PortOnePaymentResponse response = fetchPortOnePaymentOrThrow(payment.getPaymentId());
        assertPaidMatchesOrder(payment, response);
        confirmPaidPayment(payment, response);
        log.info("결제 완료: paymentId={}, userId={}", request.getPaymentId(), userId);

        return CompletePaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .reservationId(payment.getReservation().getId())
                .status(payment.getStatus())
                .amount(payment.getFinalAmount())
                .paidAt(payment.getPaidAt())
                .build();
    }

    @Transactional(readOnly = true)
    public PaymentDetailResponse getPayment(String paymentId) {
        Payment payment =
                paymentRepository
                        .findByPaymentId(paymentId)
                        .orElseThrow(() -> new CustomException(ErrorCode.PAYMENT_NOT_FOUND));

        return PaymentDetailResponse.from(payment);
    }

    @Transactional
    public void handleWebhook(String rawBody, HttpServletRequest request)
            throws WebhookVerificationException {
        String secret = properties.getWebhookSecret();
        if (secret == null || secret.isBlank()) {
            log.warn("[포트원 웹훅] webhook secret 미설정");
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "PortOne webhook secret is not configured");
        }

        WebhookVerifier verifier = new WebhookVerifier(secret);
        verifier.verify(
                rawBody,
                request.getHeader(WebhookVerifier.HEADER_ID),
                request.getHeader(WebhookVerifier.HEADER_SIGNATURE),
                request.getHeader(WebhookVerifier.HEADER_TIMESTAMP));

        JsonNode root;
        try {
            root = objectMapper.readTree(rawBody);
        } catch (Exception e) {
            log.warn("[포트원 웹훅] JSON 파싱 실패", e);
            return;
        }

        String type = root.path("type").asText(null);
        if (type == null) {
            return;
        }

        JsonNode data = root.get("data");
        String paymentId =
                (data != null && data.hasNonNull("paymentId"))
                        ? data.get("paymentId").asText(null)
                        : null;

        switch (type) {
            case "Transaction.Paid" -> {
                if (paymentId != null) {
                    syncPaidFromPortOneByWebhook(paymentId);
                }
            }
            case "Transaction.Failed" -> {
                if (paymentId != null) {
                    syncFailedFromPortOneByWebhook(paymentId);
                }
            }
            case "Transaction.Cancelled" -> {
                if (paymentId != null) {
                    syncCancelledFromPortOneByWebhook(paymentId);
                }
            }
            case "Transaction.VirtualAccountIssued" -> {
                if (paymentId != null) {
                    syncVirtualAccountIssuedFromPortOneByWebhook(paymentId);
                }
            }
            case "Transaction.PayPending" -> {
                if (paymentId != null) {
                    syncPayPendingFromPortOneByWebhook(paymentId);
                }
            }
            default -> {
                // 알 수 없는 타입은 포트원 가이드대로 무시
            }
        }
    }

    private void syncPaidFromPortOneByWebhook(String paymentId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId).orElse(null);
        if (payment == null) {
            log.warn("[포트원 웹훅] 알 수 없는 paymentId: paymentId={}", paymentId);
            return;
        }
        if (payment.getStatus() == PaymentStatus.PAID) {
            return;
        }
        PortOnePaymentResponse remote = fetchPortOnePaymentSilent(paymentId);
        if (remote == null) {
            log.warn("[포트원 웹훅] 포트원에서 결제 정보 조회 실패: paymentId={}", paymentId);
            return;
        }
        if (!amountMatches(payment, remote)) {
            log.warn("[포트원 웹훅] 금액 불일치: paymentId={}", paymentId);
            return;
        }
        if (remote.getStatus() != PaymentStatus.PAID) {
            return;
        }
        try {
            confirmPaidPayment(payment, remote);
        } catch (CustomException e) {
            if (e.getErrorCode() == ErrorCode.PAYMENT_ALREADY_DONE
                    || e.getErrorCode() == ErrorCode.RESERVATION_ALREADY_CONFIRMED) {
                return;
            }
            throw e;
        }
    }

    private void syncFailedFromPortOneByWebhook(String paymentId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId).orElse(null);
        if (payment == null) {
            log.warn("[포트원 웹훅] 알 수 없는 paymentId: paymentId={}", paymentId);
            return;
        }
        PortOnePaymentResponse remote = fetchPortOnePaymentSilent(paymentId);
        if (remote == null || remote.getStatus() != PaymentStatus.FAILED) {
            return;
        }
        try {
            payment.markFailed("포트원 결제 실패");
            log.info("[포트원 웹훅] 결제 실패 처리: paymentId={}", paymentId);
        } catch (CustomException ignored) {
            // 이미 종료된 건 등은 무시
        }
    }

    private void syncCancelledFromPortOneByWebhook(String paymentId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId).orElse(null);
        if (payment == null) {
            log.warn("[포트원 웹훅] 알 수 없는 paymentId: paymentId={}", paymentId);
            return;
        }
        PortOnePaymentResponse remote = fetchPortOnePaymentSilent(paymentId);
        if (remote == null) {
            return;
        }
        if (remote.getStatus() != PaymentStatus.CANCELLED) {
            return;
        }
        try {
            payment.markCancelled();
            Reservation reservation = payment.getReservation();
            if (reservation.getStatus()
                    == com.breadbread.reservation.entity.ReservationStatus.CONFIRMED) {
                reservation.cancel();
            }
            log.info("[포트원 웹훅] 결제 취소 처리: paymentId={}", paymentId);
        } catch (CustomException ignored) {
        }
    }

    private void syncVirtualAccountIssuedFromPortOneByWebhook(String paymentId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId).orElse(null);
        if (payment == null) {
            log.warn("[포트원 웹훅] 알 수 없는 paymentId: paymentId={}", paymentId);
            return;
        }
        PortOnePaymentResponse remote = fetchPortOnePaymentSilent(paymentId);
        if (remote == null || remote.getStatus() != PaymentStatus.VIRTUAL_ACCOUNT_ISSUED) {
            return;
        }
        try {
            payment.markVirtualAccountIssued();
            log.info("[포트원 웹훅] 가상계좌 발급 처리: paymentId={}", paymentId);
        } catch (CustomException ignored) {
        }
    }

    private void syncPayPendingFromPortOneByWebhook(String paymentId) {
        Payment payment = paymentRepository.findByPaymentId(paymentId).orElse(null);
        if (payment == null) {
            log.warn("[포트원 웹훅] 알 수 없는 paymentId: paymentId={}", paymentId);
            return;
        }
        PortOnePaymentResponse remote = fetchPortOnePaymentSilent(paymentId);
        if (remote == null || remote.getStatus() != PaymentStatus.PAY_PENDING) {
            return;
        }
        try {
            payment.markPayPending();
            log.info("[포트원 웹훅] 결제 승인 대기 처리: paymentId={}", paymentId);
        } catch (CustomException ignored) {
        }
    }

    private PortOnePaymentResponse fetchPortOnePaymentOrThrow(String paymentId) {
        try {
            return portOneClient
                    .http()
                    .get()
                    .uri("/payments/{paymentId}", paymentId)
                    .retrieve()
                    .bodyToMono(PortOnePaymentResponse.class)
                    .block();
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                throw new CustomException(ErrorCode.PAYMENT_FAILED);
            }
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        } catch (WebClientRequestException e) {
            log.warn("PortOne API 연결 실패 paymentId={}: {}", paymentId, e.getMessage());
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }
    }

    private PortOnePaymentResponse fetchPortOnePaymentSilent(String paymentId) {
        try {
            return portOneClient
                    .http()
                    .get()
                    .uri("/payments/{paymentId}", paymentId)
                    .retrieve()
                    .bodyToMono(PortOnePaymentResponse.class)
                    .block();
        } catch (WebClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                return null;
            }
            log.warn("[포트원 웹훅] API 호출 실패: paymentId={}, status={}", paymentId, e.getStatusCode());
            return null;
        } catch (WebClientRequestException e) {
            log.warn("[포트원 웹훅] API 연결 실패: paymentId={}, msg={}", paymentId, e.getMessage());
            return null;
        }
    }

    private void assertPaidMatchesOrder(Payment payment, PortOnePaymentResponse response) {
        if (!amountMatches(payment, response)) {
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }
        if (response.getStatus() != PaymentStatus.PAID) {
            throw new CustomException(ErrorCode.PAYMENT_FAILED);
        }
    }

    private boolean amountMatches(Payment payment, PortOnePaymentResponse response) {
        return response.getAmount() != null
                && response.getAmount().getTotal() == payment.getFinalAmount();
    }

    private void confirmPaidPayment(Payment payment, PortOnePaymentResponse response) {
        LocalDateTime paidAt =
                response.getStatusChangedAt() != null
                        ? response.getStatusChangedAt().toLocalDateTime()
                        : LocalDateTime.now();
        payment.markPaid(response.getTransactionId(), paidAt);
        payment.getReservation().confirm();
    }
}

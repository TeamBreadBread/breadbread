package com.breadbread.payment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockConstruction;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.payment.client.PortOneClient;
import com.breadbread.payment.config.PortOneProperties;
import com.breadbread.payment.dto.CompletePaymentRequest;
import com.breadbread.payment.dto.PortOnePaymentResponse;
import com.breadbread.payment.dto.PreparePaymentRequest;
import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentMethod;
import com.breadbread.payment.entity.PaymentMethodDetail;
import com.breadbread.payment.entity.PaymentStatus;
import com.breadbread.payment.entity.PgProvider;
import com.breadbread.payment.repository.PaymentRepository;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.portone.sdk.server.errors.WebhookVerificationException;
import io.portone.sdk.server.webhook.WebhookVerifier;
import jakarta.servlet.http.HttpServletRequest;
import java.net.URI;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedConstruction;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Mono;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class PaymentServiceTest {

    private static final LocalDate DEPARTURE_DATE = LocalDate.of(2026, 6, 1);

    @Mock private ReservationRepository reservationRepository;
    @Mock private UserRepository userRepository;
    @Mock private PaymentRepository paymentRepository;
    @Mock private WebClient webClient;
    @Mock private PortOneProperties properties;

    private PortOneClient portOneClient;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        portOneClient = new PortOneClient(webClient);
        paymentService =
                new PaymentService(
                        reservationRepository,
                        userRepository,
                        paymentRepository,
                        portOneClient,
                        properties,
                        new ObjectMapper());
    }

    @Test
    void preparePayment_throws_whenReservationMissing() {
        PreparePaymentRequest request = prepareRequest(1L);
        when(reservationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.preparePayment(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_NOT_FOUND);
    }

    @Test
    void preparePayment_throws_whenRequesterIsNotOwner() {
        PreparePaymentRequest request = prepareRequest(1L);
        Reservation reservation = reservation(1L, user(10L), manualCourse("코스"));
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> paymentService.preparePayment(99L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void preparePayment_saves_whenReservationOwned() {
        PreparePaymentRequest request = prepareRequest(1L);
        User owner = user(10L);
        Reservation reservation = reservation(1L, owner, manualCourse("대전 코스"));
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(properties.getStoreId()).thenReturn("store-1");
        when(properties.getChannelKey()).thenReturn("channel-1");

        var response = paymentService.preparePayment(10L, request);

        ArgumentCaptor<Payment> captor = ArgumentCaptor.forClass(Payment.class);
        verify(paymentRepository).save(captor.capture());
        Payment saved = captor.getValue();
        assertThat(saved.getFinalAmount()).isEqualTo(12000L);
        assertThat(saved.getReservation()).isSameAs(reservation);
        assertThat(saved.getPaymentMethod()).isEqualTo(PaymentMethod.CARD);
        assertThat(saved.getPaymentMethodDetail()).isEqualTo(PaymentMethodDetail.CARD);
        assertThat(saved.getPgProvider()).isEqualTo(PgProvider.TOSS_PAYMENT);
        assertThat(saved.getStatus()).isEqualTo(PaymentStatus.READY);

        assertThat(response.getAmount()).isEqualTo(12000L);
        assertThat(response.getOrderName()).contains("대전 코스");
        assertThat(response.getStoreId()).isEqualTo("store-1");
        assertThat(response.getChannelKey()).isEqualTo("channel-1");
        assertThat(response.getPaymentId()).isNotBlank();
    }

    @Test
    void completePayment_throws_whenPaymentMissing() {
        CompletePaymentRequest request = completeRequest("missing-pay");
        when(paymentRepository.findByPaymentId("missing-pay")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.completePayment(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_NOT_FOUND);
    }

    @Test
    void completePayment_throws_whenUserMissing() {
        User payer = user(10L);
        Reservation res = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-1", payer, res, 12000L);
        CompletePaymentRequest request = completeRequest("pay-1");
        when(paymentRepository.findByPaymentId("pay-1")).thenReturn(Optional.of(payment));
        when(userRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.completePayment(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void completePayment_throws_whenRequesterIsNotPayer() {
        User payer = user(10L);
        Reservation res = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-1", payer, res, 12000L);
        CompletePaymentRequest request = completeRequest("pay-1");
        when(paymentRepository.findByPaymentId("pay-1")).thenReturn(Optional.of(payment));
        when(userRepository.findById(99L)).thenReturn(Optional.of(user(99L)));

        assertThatThrownBy(() -> paymentService.completePayment(99L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void completePayment_returnsImmediately_whenAlreadyPaidWithoutCallingPortOne() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-paid", payer, reservation, 12000L);
        payment.markPaid("tx-old", LocalDateTime.of(2026, 5, 1, 12, 0));

        CompletePaymentRequest request = completeRequest("pay-paid");
        when(paymentRepository.findByPaymentId("pay-paid")).thenReturn(Optional.of(payment));
        when(userRepository.findById(10L)).thenReturn(Optional.of(payer));

        var response = paymentService.completePayment(10L, request);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(response.getAmount()).isEqualTo(12000L);
        verify(webClient, never()).get();
    }

    @Test
    void completePayment_marksPaid_andConfirmsReservation_whenPortOneReportsPaid() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-live", payer, reservation, 12000L);
        CompletePaymentRequest request = completeRequest("pay-live");

        PortOnePaymentResponse remote =
                portOneResponse(PaymentStatus.PAID, "tx-remote", 12000L, OffsetDateTime.now());

        stubPortOneGetPayment("pay-live", Mono.just(remote));

        when(paymentRepository.findByPaymentId("pay-live")).thenReturn(Optional.of(payment));
        when(userRepository.findById(10L)).thenReturn(Optional.of(payer));

        var response = paymentService.completePayment(10L, request);

        assertThat(response.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(response.getPaidAt()).isNotNull();
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(reservation.getConfirmedAt()).isNotNull();
    }

    @Test
    void completePayment_throws_whenPortOneAmountDoesNotMatch() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-amt", payer, reservation, 12000L);
        CompletePaymentRequest request = completeRequest("pay-amt");

        PortOnePaymentResponse remote =
                portOneResponse(PaymentStatus.PAID, "tx", 9999L, OffsetDateTime.now());
        stubPortOneGetPayment("pay-amt", Mono.just(remote));

        when(paymentRepository.findByPaymentId("pay-amt")).thenReturn(Optional.of(payment));
        when(userRepository.findById(10L)).thenReturn(Optional.of(payer));

        assertThatThrownBy(() -> paymentService.completePayment(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_FAILED);
    }

    @Test
    void completePayment_throws_whenPortOneStatusIsNotPaid() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-ready", payer, reservation, 12000L);
        CompletePaymentRequest request = completeRequest("pay-ready");

        PortOnePaymentResponse remote =
                portOneResponse(PaymentStatus.READY, null, 12000L, OffsetDateTime.now());
        stubPortOneGetPayment("pay-ready", Mono.just(remote));

        when(paymentRepository.findByPaymentId("pay-ready")).thenReturn(Optional.of(payment));
        when(userRepository.findById(10L)).thenReturn(Optional.of(payer));

        assertThatThrownBy(() -> paymentService.completePayment(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_FAILED);
    }

    @Test
    void completePayment_throws_whenPortOneReturns404() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-404", payer, reservation, 12000L);
        CompletePaymentRequest request = completeRequest("pay-404");

        stubPortOneGetPayment(
                "pay-404",
                Mono.error(
                        WebClientResponseException.create(
                                HttpStatus.NOT_FOUND.value(), "Not Found", null, null, null)));

        when(paymentRepository.findByPaymentId("pay-404")).thenReturn(Optional.of(payment));
        when(userRepository.findById(10L)).thenReturn(Optional.of(payer));

        assertThatThrownBy(() -> paymentService.completePayment(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_FAILED);
    }

    @Test
    void completePayment_throws_whenPortOneConnectionFails() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-conn", payer, reservation, 12000L);
        CompletePaymentRequest request = completeRequest("pay-conn");

        stubPortOneGetPayment("pay-conn", Mono.error(webClientRequestConnectFailure("pay-conn")));

        when(paymentRepository.findByPaymentId("pay-conn")).thenReturn(Optional.of(payment));
        when(userRepository.findById(10L)).thenReturn(Optional.of(payer));

        assertThatThrownBy(() -> paymentService.completePayment(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_FAILED);
    }

    @Test
    void getPayment_throws_whenMissing() {
        when(paymentRepository.findByPaymentId("x")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> paymentService.getPayment("x"))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.PAYMENT_NOT_FOUND);
    }

    @Test
    void getPayment_returns_detail_whenPaymentExists() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-detail", payer, reservation, 12000L);
        ReflectionTestUtils.setField(payment, "id", 42L);
        when(paymentRepository.findByPaymentId("pay-detail")).thenReturn(Optional.of(payment));

        var detail = paymentService.getPayment("pay-detail");

        assertThat(detail.getPaymentId()).isEqualTo("pay-detail");
        assertThat(detail.getReservationId()).isEqualTo(1L);
        assertThat(detail.getFinalAmount()).isEqualTo(12000L);
    }

    @Test
    void handleWebhook_throwsBadRequest_whenSecretNotConfigured() {
        when(properties.getWebhookSecret()).thenReturn("   ");
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);

        assertThatThrownBy(() -> paymentService.handleWebhook("{}", servletRequest))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(
                        ex ->
                                assertThat(((ResponseStatusException) ex).getStatusCode())
                                        .isEqualTo(HttpStatus.BAD_REQUEST));
    }

    @Test
    void handleWebhook_dispatches_paid_when_transaction_paid_and_payment_id_present()
            throws WebhookVerificationException {
        when(properties.getWebhookSecret()).thenReturn("webhook-secret");
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        String rawBody =
                "{\"type\":\"Transaction.Paid\",\"data\":{\"paymentId\":\"pay-hook-paid\"}}";

        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("Course A"));
        Payment payment = unpaidPayment("pay-hook-paid", payer, reservation, 12000L);
        when(paymentRepository.findByPaymentId("pay-hook-paid")).thenReturn(Optional.of(payment));
        stubPortOneGetPayment(
                "pay-hook-paid",
                Mono.just(
                        portOneResponse(
                                PaymentStatus.PAID, "tx-hook", 12000L, OffsetDateTime.now())));

        try (MockedConstruction<WebhookVerifier> ignored =
                mockConstruction(WebhookVerifier.class)) {
            paymentService.handleWebhook(rawBody, servletRequest);
        }

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
    }

    @Test
    void handleWebhook_ignores_unknown_event_type_without_calling_port_one()
            throws WebhookVerificationException {
        when(properties.getWebhookSecret()).thenReturn("webhook-secret");
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        String rawBody = "{\"type\":\"Unknown.Event\",\"data\":{\"paymentId\":\"pay-ignored\"}}";

        try (MockedConstruction<WebhookVerifier> ignored =
                mockConstruction(WebhookVerifier.class)) {
            paymentService.handleWebhook(rawBody, servletRequest);
        }

        verify(webClient, never()).get();
    }

    @Test
    void handleWebhook_returns_silently_when_body_is_invalid_json()
            throws WebhookVerificationException {
        when(properties.getWebhookSecret()).thenReturn("webhook-secret");
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);

        try (MockedConstruction<WebhookVerifier> ignored =
                mockConstruction(WebhookVerifier.class)) {
            paymentService.handleWebhook("{not-json", servletRequest);
        }

        verify(webClient, never()).get();
    }

    @Test
    void handleWebhook_skips_port_one_when_transaction_paid_without_payment_id()
            throws WebhookVerificationException {
        when(properties.getWebhookSecret()).thenReturn("webhook-secret");
        HttpServletRequest servletRequest = mock(HttpServletRequest.class);
        String rawBody = "{\"type\":\"Transaction.Paid\",\"data\":{}}";

        try (MockedConstruction<WebhookVerifier> ignored =
                mockConstruction(WebhookVerifier.class)) {
            paymentService.handleWebhook(rawBody, servletRequest);
        }

        verify(webClient, never()).get();
    }

    @Test
    void syncPaidFromPortOneByWebhook_marks_paid_when_port_one_reports_paid() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-webhook-paid", payer, reservation, 12000L);

        when(paymentRepository.findByPaymentId("pay-webhook-paid"))
                .thenReturn(Optional.of(payment));
        stubPortOneGetPayment(
                "pay-webhook-paid",
                Mono.just(
                        portOneResponse(
                                PaymentStatus.PAID, "tx-webhook", 12000L, OffsetDateTime.now())));

        paymentService.syncPaidFromPortOneByWebhook("pay-webhook-paid");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAID);
        assertThat(payment.getPaidAt()).isNotNull();
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CONFIRMED);
        assertThat(reservation.getConfirmedAt()).isNotNull();
    }

    @Test
    void syncFailedFromPortOneByWebhook_marks_failed_when_port_one_reports_failed() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-webhook-failed", payer, reservation, 12000L);

        when(paymentRepository.findByPaymentId("pay-webhook-failed"))
                .thenReturn(Optional.of(payment));
        stubPortOneGetPayment(
                "pay-webhook-failed",
                Mono.just(
                        portOneResponse(
                                PaymentStatus.FAILED, "tx-failed", 12000L, OffsetDateTime.now())));

        paymentService.syncFailedFromPortOneByWebhook("pay-webhook-failed");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.FAILED);
    }

    @Test
    void syncCancelledFromPortOneByWebhook_cancels_when_port_one_reports_cancelled() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-webhook-cancel", payer, reservation, 12000L);
        payment.markPaid("tx-before-cancel", LocalDateTime.now());
        reservation.confirm();

        when(paymentRepository.findByPaymentId("pay-webhook-cancel"))
                .thenReturn(Optional.of(payment));
        stubPortOneGetPayment(
                "pay-webhook-cancel",
                Mono.just(
                        portOneResponse(
                                PaymentStatus.CANCELLED,
                                "tx-cancel",
                                12000L,
                                OffsetDateTime.now())));

        paymentService.syncCancelledFromPortOneByWebhook("pay-webhook-cancel");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.CANCELLED);
        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(reservation.getCancelledAt()).isNotNull();
    }

    @Test
    void
            syncVirtualAccountIssuedFromPortOneByWebhook_marks_issued_when_port_one_reports_virtual_account() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-webhook-va", payer, reservation, 12000L);

        when(paymentRepository.findByPaymentId("pay-webhook-va")).thenReturn(Optional.of(payment));
        stubPortOneGetPayment(
                "pay-webhook-va",
                Mono.just(
                        portOneResponse(
                                PaymentStatus.VIRTUAL_ACCOUNT_ISSUED,
                                "tx-va",
                                12000L,
                                OffsetDateTime.now())));

        paymentService.syncVirtualAccountIssuedFromPortOneByWebhook("pay-webhook-va");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.VIRTUAL_ACCOUNT_ISSUED);
    }

    @Test
    void syncPayPendingFromPortOneByWebhook_marks_pending_when_port_one_reports_pay_pending() {
        User payer = user(10L);
        Reservation reservation = reservation(1L, payer, manualCourse("코스"));
        Payment payment = unpaidPayment("pay-webhook-pending", payer, reservation, 12000L);

        when(paymentRepository.findByPaymentId("pay-webhook-pending"))
                .thenReturn(Optional.of(payment));
        stubPortOneGetPayment(
                "pay-webhook-pending",
                Mono.just(
                        portOneResponse(
                                PaymentStatus.PAY_PENDING,
                                "tx-pending",
                                12000L,
                                OffsetDateTime.now())));

        paymentService.syncPayPendingFromPortOneByWebhook("pay-webhook-pending");

        assertThat(payment.getStatus()).isEqualTo(PaymentStatus.PAY_PENDING);
    }

    private static WebClientRequestException webClientRequestConnectFailure(String paymentId) {
        return new WebClientRequestException(
                new RuntimeException("connect"),
                HttpMethod.GET,
                URI.create("https://api.portone.io/payments/" + paymentId),
                HttpHeaders.EMPTY);
    }

    private void stubPortOneGetPayment(String paymentId, Mono<PortOnePaymentResponse> mono) {
        WebClient.RequestHeadersUriSpec<?> uriSpec = mock(WebClient.RequestHeadersUriSpec.class);
        WebClient.RequestHeadersSpec<?> headersSpec = mock(WebClient.RequestHeadersSpec.class);
        WebClient.ResponseSpec responseSpec = mock(WebClient.ResponseSpec.class);

        doReturn(uriSpec).when(webClient).get();
        doReturn(headersSpec).when(uriSpec).uri(eq("/payments/{paymentId}"), eq(paymentId));
        doReturn(responseSpec).when(headersSpec).retrieve();
        when(responseSpec.bodyToMono(eq(PortOnePaymentResponse.class))).thenReturn(mono);
    }

    private static PortOnePaymentResponse portOneResponse(
            PaymentStatus status,
            String transactionId,
            long totalAmount,
            OffsetDateTime changedAt) {
        PortOnePaymentResponse.Amount amount = new PortOnePaymentResponse.Amount();
        ReflectionTestUtils.setField(amount, "total", totalAmount);
        return PortOnePaymentResponse.builder()
                .status(status)
                .transactionId(transactionId)
                .amount(amount)
                .statusChangedAt(changedAt)
                .build();
    }

    private static PreparePaymentRequest prepareRequest(Long reservationId) {
        PreparePaymentRequest request = new PreparePaymentRequest();
        ReflectionTestUtils.setField(request, "reservationId", reservationId);
        ReflectionTestUtils.setField(request, "paymentMethod", PaymentMethod.CARD);
        ReflectionTestUtils.setField(request, "paymentMethodDetail", PaymentMethodDetail.CARD);
        return request;
    }

    private static CompletePaymentRequest completeRequest(String paymentId) {
        CompletePaymentRequest request = new CompletePaymentRequest();
        ReflectionTestUtils.setField(request, "paymentId", paymentId);
        return request;
    }

    private static Payment unpaidPayment(
            String paymentId, User user, Reservation reservation, long amount) {
        Payment payment =
                Payment.builder()
                        .paymentId(paymentId)
                        .originalAmount(amount)
                        .discountAmount(0L)
                        .finalAmount(amount)
                        .paymentMethod(PaymentMethod.CARD)
                        .paymentMethodDetail(PaymentMethodDetail.CARD)
                        .pgProvider(PgProvider.TOSS_PAYMENT)
                        .user(user)
                        .reservation(reservation)
                        .build();
        return payment;
    }

    private static Reservation reservation(Long id, User user, Course course) {
        Reservation reservation =
                Reservation.builder()
                        .departureDate(DEPARTURE_DATE)
                        .departureTime(LocalTime.of(10, 0))
                        .headCount(2)
                        .departure("역")
                        .departureLat(36.0)
                        .departureLng(127.0)
                        .user(user)
                        .course(course)
                        .build();
        ReflectionTestUtils.setField(reservation, "id", id);
        return reservation;
    }

    private static Course manualCourse(String name) {
        Course course =
                Course.createManual(
                        name,
                        "thumb.jpg",
                        "2h",
                        12000L,
                        "테마",
                        "대전",
                        ManualCourseInfo.builder().editorPick(false).build());
        ReflectionTestUtils.setField(course, "id", 3L);
        return course;
    }

    private static User user(Long id) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("이름" + id)
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
}

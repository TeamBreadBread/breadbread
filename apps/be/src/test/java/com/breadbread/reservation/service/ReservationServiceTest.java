package com.breadbread.reservation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.course.repository.CourseLikeRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentMethod;
import com.breadbread.payment.entity.PaymentMethodDetail;
import com.breadbread.payment.entity.PaymentStatus;
import com.breadbread.payment.entity.PgProvider;
import com.breadbread.payment.repository.PaymentRepository;
import com.breadbread.reservation.dto.CreateReservationRequest;
import com.breadbread.reservation.dto.UpdateReservationRequest;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class ReservationServiceTest {

    private static final LocalDate FIXED_DATE = LocalDate.of(2026, 5, 20);
    private static final LocalDate NEXT_DATE = FIXED_DATE.plusDays(1);
    private static final LocalDate UPDATED_DATE = FIXED_DATE.plusDays(2);
    private static final LocalTime DEFAULT_TIME = LocalTime.of(10, 0);
    private static final LocalTime UPDATED_TIME = LocalTime.of(11, 0);
    private static final LocalTime UPDATED_HALF_HOUR_TIME = LocalTime.of(11, 30);

    @Mock private ReservationRepository reservationRepository;
    @Mock private CourseRepository courseRepository;
    @Mock private UserRepository userRepository;
    @Mock private CourseLikeRepository courseLikeRepository;
    @Mock private BakeryImageRepository bakeryImageRepository;
    @Mock private PaymentRepository paymentRepository;

    @InjectMocks private ReservationService reservationService;

    @Test
    void getMyReservations_filtersByStatus_whenProvided() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        when(reservationRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(
                        10L, ReservationStatus.PENDING))
                .thenReturn(List.of(reservation));

        var result = reservationService.getMyReservations(10L, ReservationStatus.PENDING);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        assertThat(result.get(0).getCourseNameSnapshot()).isEqualTo("course");
    }

    @Test
    void getMyReservations_usesUnfilteredQuery_whenStatusIsNull() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        when(reservationRepository.findAllByUserIdOrderByCreatedAtDesc(10L))
                .thenReturn(List.of(reservation));

        var result = reservationService.getMyReservations(10L, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
        verify(reservationRepository).findAllByUserIdOrderByCreatedAtDesc(10L);
    }

    @Test
    void getReservation_throws_whenReservationMissing() {
        when(reservationRepository.findWithCourseById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.getReservation(10L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_NOT_FOUND);
    }

    @Test
    void getReservation_throws_whenRequesterIsNotOwner() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        when(reservationRepository.findWithCourseById(1L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.getReservation(99L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void getReservation_includes_course_and_paid_payment_when_owner() {
        User owner = user(10L);
        Course course = manualCourse(3L, "daejeon-course");
        Bakery bakery = bakery(100L, "bakery");
        course.addCourseBakery(CourseBakery.builder().bakery(bakery).visitOrder(1).build());
        Reservation reservation = reservation(1L, owner, course);
        Payment payment = paidPayment("pay-1", owner, reservation);

        when(reservationRepository.findWithCourseById(1L)).thenReturn(Optional.of(reservation));
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(100L), 1))
                .thenReturn(
                        List.of(
                                BakeryImage.builder()
                                        .bakery(bakery)
                                        .displayOrder(1)
                                        .imageUrl("thumb.jpg")
                                        .build()));
        when(courseLikeRepository.countByCourse(course)).thenReturn(2L);
        when(courseLikeRepository.existsByCourseIdAndUserId(3L, 10L)).thenReturn(true);
        when(paymentRepository.findTopByReservationIdAndStatusOrderByPaidAtDesc(
                        1L, PaymentStatus.PAID))
                .thenReturn(Optional.of(payment));

        var result = reservationService.getReservation(10L, 1L);

        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getCourse().getId()).isEqualTo(3L);
        assertThat(result.getCourse().getLikeCount()).isEqualTo(2);
        assertThat(result.getCourse().isLiked()).isTrue();
        assertThat(result.getPayment()).isNotNull();
        assertThat(result.getPayment().getAmount()).isEqualTo(12000L);
        assertThat(result.getPayment().getPaymentMethodDetail())
                .isEqualTo(PaymentMethodDetail.CARD);
        assertThat(result.getPayment().getPaidAt()).isNotNull();
    }

    @Test
    void createReservation_throws_whenConfirmedReservationAlreadyExists() {
        CreateReservationRequest request = createReservationRequest(3L);
        when(reservationRepository.existsByUserIdAndDepartureDateAndDepartureTimeAndStatusIn(
                        eq(10L),
                        eq(request.getDepartureDate()),
                        eq(request.getDepartureTime()),
                        eq(Set.of(ReservationStatus.CONFIRMED))))
                .thenReturn(true);

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_RESERVED);
    }

    @Test
    void createReservation_reuses_pending_when_same_slot_and_course() {
        CreateReservationRequest request = createReservationRequest(3L);
        User owner = user(10L);
        Course course = manualCourse(3L, "course");
        Reservation pending = reservation(5L, owner, course);

        stubNoConfirmedConflict(request);
        when(reservationRepository
                        .findFirstByUserIdAndDepartureDateAndDepartureTimeAndStatusOrderByIdDesc(
                                10L,
                                request.getDepartureDate(),
                                request.getDepartureTime(),
                                ReservationStatus.PENDING))
                .thenReturn(Optional.of(pending));
        when(paymentRepository.existsByReservationIdAndStatus(5L, PaymentStatus.PAID))
                .thenReturn(false);

        Long result = reservationService.createReservation(10L, request);

        assertThat(result).isEqualTo(5L);
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void createReservation_throws_whenPendingReservationExistsForDifferentCourse() {
        CreateReservationRequest request = createReservationRequest(3L);
        Reservation pending = reservation(5L, user(10L), manualCourse(99L, "other-course"));

        stubNoConfirmedConflict(request);
        when(reservationRepository
                        .findFirstByUserIdAndDepartureDateAndDepartureTimeAndStatusOrderByIdDesc(
                                10L,
                                request.getDepartureDate(),
                                request.getDepartureTime(),
                                ReservationStatus.PENDING))
                .thenReturn(Optional.of(pending));

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_RESERVED);
    }

    @Test
    void createReservation_throws_whenPendingReservationAlreadyHasPaidPayment() {
        CreateReservationRequest request = createReservationRequest(3L);
        Reservation pending = reservation(5L, user(10L), manualCourse(3L, "same-course"));

        stubNoConfirmedConflict(request);
        when(reservationRepository
                        .findFirstByUserIdAndDepartureDateAndDepartureTimeAndStatusOrderByIdDesc(
                                10L,
                                request.getDepartureDate(),
                                request.getDepartureTime(),
                                ReservationStatus.PENDING))
                .thenReturn(Optional.of(pending));
        when(paymentRepository.existsByReservationIdAndStatus(5L, PaymentStatus.PAID))
                .thenReturn(true);

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_RESERVED);
    }

    @Test
    void createReservation_throws_whenCourseMissing() {
        CreateReservationRequest request = createReservationRequest(3L);

        stubNoConfirmedConflict(request);
        when(reservationRepository
                        .findFirstByUserIdAndDepartureDateAndDepartureTimeAndStatusOrderByIdDesc(
                                10L,
                                request.getDepartureDate(),
                                request.getDepartureTime(),
                                ReservationStatus.PENDING))
                .thenReturn(Optional.empty());
        when(courseRepository.findById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void createReservation_throws_whenUserMissing() {
        CreateReservationRequest request = createReservationRequest(3L);
        Course course = manualCourse(3L, "course");

        stubNoConfirmedConflict(request);
        when(reservationRepository
                        .findFirstByUserIdAndDepartureDateAndDepartureTimeAndStatusOrderByIdDesc(
                                10L,
                                request.getDepartureDate(),
                                request.getDepartureTime(),
                                ReservationStatus.PENDING))
                .thenReturn(Optional.empty());
        when(courseRepository.findById(3L)).thenReturn(Optional.of(course));
        when(userRepository.findById(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void createReservation_saves_new_when_no_conflict_exists() {
        CreateReservationRequest request = createReservationRequest(3L);
        User owner = user(10L);
        Course course = manualCourse(3L, "course");

        stubNoConfirmedConflict(request);
        when(reservationRepository
                        .findFirstByUserIdAndDepartureDateAndDepartureTimeAndStatusOrderByIdDesc(
                                10L,
                                request.getDepartureDate(),
                                request.getDepartureTime(),
                                ReservationStatus.PENDING))
                .thenReturn(Optional.empty());
        when(courseRepository.findById(3L)).thenReturn(Optional.of(course));
        when(userRepository.findById(10L)).thenReturn(Optional.of(owner));
        when(reservationRepository.save(any(Reservation.class)))
                .thenAnswer(
                        invocation -> {
                            Reservation saved = invocation.getArgument(0);
                            ReflectionTestUtils.setField(saved, "id", 77L);
                            return saved;
                        });

        Long result = reservationService.createReservation(10L, request);

        assertThat(result).isEqualTo(77L);
        ArgumentCaptor<Reservation> captor = ArgumentCaptor.forClass(Reservation.class);
        verify(reservationRepository).save(captor.capture());
        assertThat(captor.getValue().getDeparture()).isEqualTo("daejeon-station");
        assertThat(captor.getValue().getQuotedAmount()).isEqualTo(12000L);
    }

    @Test
    void createReservation_throws_whenDepartureMinuteIsNotThirtyMinuteUnit() {
        CreateReservationRequest request = createReservationRequest(3L);
        ReflectionTestUtils.setField(request, "departureTime", LocalTime.of(10, 15));

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_RESERVATION_TIME);
    }

    @Test
    void createReservation_throws_whenDepartureLocationIsPartiallyMissing() {
        CreateReservationRequest request = createReservationRequest(3L);
        ReflectionTestUtils.setField(request, "lng", null);

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void createReservation_throws_whenDepartureDateTimeIsInPast() {
        CreateReservationRequest request = createReservationRequest(3L);
        LocalDateTime past =
                LocalDateTime.now()
                        .minusDays(1)
                        .withHour(10)
                        .withMinute(0)
                        .withSecond(0)
                        .withNano(0);
        ReflectionTestUtils.setField(request, "departureDate", past.toLocalDate());
        ReflectionTestUtils.setField(request, "departureTime", past.toLocalTime());

        assertThatThrownBy(() -> reservationService.createReservation(10L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_RESERVATION_TIME);
    }

    @Test
    void updateReservation_throws_whenReservationMissing() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                reservationService.updateReservation(
                                        10L, 1L, new UpdateReservationRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_NOT_FOUND);
    }

    @Test
    void updateReservation_throws_whenRequesterIsNotOwner() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(
                        () ->
                                reservationService.updateReservation(
                                        99L, 1L, new UpdateReservationRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void updateReservation_throws_whenPartialDepartureLocationProvided() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        UpdateReservationRequest request = new UpdateReservationRequest();
        ReflectionTestUtils.setField(request, "departure", "new-place");

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.updateReservation(10L, 1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void updateReservation_throws_whenAnotherActiveReservationExistsAtSameSlot() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        UpdateReservationRequest request = new UpdateReservationRequest();
        ReflectionTestUtils.setField(request, "departureDate", UPDATED_DATE);
        ReflectionTestUtils.setField(request, "departureTime", UPDATED_TIME);

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationRepository
                        .existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNot(
                                10L,
                                UPDATED_DATE,
                                UPDATED_TIME,
                                Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                                1L))
                .thenReturn(true);

        assertThatThrownBy(() -> reservationService.updateReservation(10L, 1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_RESERVED);
    }

    @Test
    void updateReservation_updatesReservation_whenOwnerAndNoConflict() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        UpdateReservationRequest request = new UpdateReservationRequest();
        ReflectionTestUtils.setField(request, "departureDate", UPDATED_DATE);
        ReflectionTestUtils.setField(request, "departureTime", UPDATED_HALF_HOUR_TIME);
        ReflectionTestUtils.setField(request, "departure", "terminal");
        ReflectionTestUtils.setField(request, "lat", 36.35);
        ReflectionTestUtils.setField(request, "lng", 127.44);
        ReflectionTestUtils.setField(request, "headCount", 3);

        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationRepository
                        .existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNot(
                                10L,
                                UPDATED_DATE,
                                UPDATED_HALF_HOUR_TIME,
                                Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                                1L))
                .thenReturn(false);

        reservationService.updateReservation(10L, 1L, request);

        assertThat(reservation.getDeparture()).isEqualTo("terminal");
        assertThat(reservation.getDepartureLat()).isEqualTo(36.35);
        assertThat(reservation.getDepartureLng()).isEqualTo(127.44);
        assertThat(reservation.getHeadCount()).isEqualTo(3);
    }

    @Test
    void updateReservation_throws_whenReservationAlreadyCancelled() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        reservation.cancel();
        UpdateReservationRequest request = new UpdateReservationRequest();
        ReflectionTestUtils.setField(request, "headCount", 4);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationRepository
                        .existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNot(
                                10L,
                                reservation.getDepartureDate(),
                                reservation.getDepartureTime(),
                                Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                                1L))
                .thenReturn(false);

        assertThatThrownBy(() -> reservationService.updateReservation(10L, 1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_NOT_MODIFIABLE);
    }

    @Test
    void updateReservation_throws_whenReservationAlreadyCompleted() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        ReflectionTestUtils.setField(reservation, "status", ReservationStatus.COMPLETED);
        UpdateReservationRequest request = new UpdateReservationRequest();
        ReflectionTestUtils.setField(request, "headCount", 4);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationRepository
                        .existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNot(
                                10L,
                                reservation.getDepartureDate(),
                                reservation.getDepartureTime(),
                                Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED),
                                1L))
                .thenReturn(false);

        assertThatThrownBy(() -> reservationService.updateReservation(10L, 1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_NOT_MODIFIABLE);
    }

    @Test
    void cancelReservation_throws_whenReservationMissing() {
        when(reservationRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> reservationService.cancelReservation(10L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_NOT_FOUND);
    }

    @Test
    void cancelReservation_throws_whenRequesterIsNotOwner() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservation(99L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void cancelReservation_marks_cancelled_when_owner_cancels() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        reservationService.cancelReservation(10L, 1L);

        assertThat(reservation.getStatus()).isEqualTo(ReservationStatus.CANCELLED);
        assertThat(reservation.getCancelledAt()).isNotNull();
    }

    @Test
    void cancelReservation_throws_whenAlreadyCancelled() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        reservation.cancel();
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservation(10L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_ALREADY_CANCELLED);
    }

    @Test
    void cancelReservation_throws_whenReservationCompleted() {
        Reservation reservation = reservation(1L, user(10L), manualCourse(3L, "course"));
        ReflectionTestUtils.setField(reservation, "status", ReservationStatus.COMPLETED);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));

        assertThatThrownBy(() -> reservationService.cancelReservation(10L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.RESERVATION_CANCEL_FAILED);
    }

    private void stubNoConfirmedConflict(CreateReservationRequest request) {
        when(reservationRepository.existsByUserIdAndDepartureDateAndDepartureTimeAndStatusIn(
                        eq(10L),
                        eq(request.getDepartureDate()),
                        eq(request.getDepartureTime()),
                        eq(Set.of(ReservationStatus.CONFIRMED))))
                .thenReturn(false);
    }

    private static CreateReservationRequest createReservationRequest(Long courseId) {
        CreateReservationRequest request = new CreateReservationRequest();
        ReflectionTestUtils.setField(request, "courseId", courseId);
        ReflectionTestUtils.setField(request, "departureDate", NEXT_DATE);
        ReflectionTestUtils.setField(request, "departureTime", DEFAULT_TIME);
        ReflectionTestUtils.setField(request, "headCount", 2);
        ReflectionTestUtils.setField(request, "departure", "daejeon-station");
        ReflectionTestUtils.setField(request, "lat", 36.332);
        ReflectionTestUtils.setField(request, "lng", 127.434);
        return request;
    }

    private static Reservation reservation(Long id, User user, Course course) {
        Reservation reservation =
                Reservation.builder()
                        .departureDate(NEXT_DATE)
                        .departureTime(DEFAULT_TIME)
                        .headCount(2)
                        .departure("daejeon-station")
                        .departureLat(36.332)
                        .departureLng(127.434)
                        .user(user)
                        .course(course)
                        .build();
        ReflectionTestUtils.setField(reservation, "id", id);
        return reservation;
    }

    private static Course manualCourse(Long id, String name) {
        Course course =
                Course.createManual(
                        name,
                        "thumb.jpg",
                        "2h",
                        12000L,
                        "theme",
                        "daejeon",
                        ManualCourseInfo.builder().editorPick(false).build());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static User user(Long id) {
        User user =
                User.builder()
                        .loginId("user" + id)
                        .password("pw")
                        .name("name" + id)
                        .nickname("nick" + id)
                        .email("u" + id + "@test.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Bakery bakery(Long id, String name) {
        Bakery bakery =
                Bakery.builder()
                        .name(name)
                        .address("address")
                        .region("daejeon")
                        .latitude(36.0)
                        .longitude(127.0)
                        .phone("010")
                        .mapLink("map")
                        .bakeryType(BakeryType.CLASSIC)
                        .dineInAvailable(true)
                        .parkingAvailable(false)
                        .drinkAvailable(true)
                        .note("")
                        .build();
        ReflectionTestUtils.setField(bakery, "id", id);
        return bakery;
    }

    private static Payment paidPayment(String paymentId, User user, Reservation reservation) {
        Payment payment =
                Payment.builder()
                        .paymentId(paymentId)
                        .originalAmount(12000L)
                        .discountAmount(0L)
                        .finalAmount(12000L)
                        .paymentMethod(PaymentMethod.CARD)
                        .paymentMethodDetail(PaymentMethodDetail.CARD)
                        .pgProvider(PgProvider.TOSS_PAYMENT)
                        .user(user)
                        .reservation(reservation)
                        .build();
        payment.markPaid("tx-1", LocalDateTime.now());
        return payment;
    }
}

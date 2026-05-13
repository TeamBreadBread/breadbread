package com.breadbread.reservation.service;

import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.course.dto.CourseBakerySummary;
import com.breadbread.course.dto.CourseSummaryResponse;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.repository.CourseLikeRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.payment.entity.Payment;
import com.breadbread.payment.entity.PaymentStatus;
import com.breadbread.payment.repository.PaymentRepository;
import com.breadbread.reservation.dto.*;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReservationService {
    private final ReservationRepository reservationRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseLikeRepository courseLikeRepository;
    private final BakeryImageRepository bakeryImageRepository;
    private final PaymentRepository paymentRepository;

    private static final Set<ReservationStatus> ACTIVE_STATUSES =
            Set.of(ReservationStatus.PENDING, ReservationStatus.CONFIRMED);

    private static final Set<ReservationStatus> CONFIRMED_ONLY =
            Set.of(ReservationStatus.CONFIRMED);

    @Transactional(readOnly = true)
    public List<ReservationSummaryResponse> getMyReservations(
            Long userId, ReservationStatus status) {
        List<Reservation> reservations =
                status != null
                        ? reservationRepository.findAllByUserIdAndStatusOrderByCreatedAtDesc(
                                userId, status)
                        : reservationRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        return reservations.stream().map(ReservationSummaryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ReservationDetailResponse getReservation(Long userId, Long reservationId) {
        Reservation reservation =
                reservationRepository
                        .findWithCourseById(reservationId)
                        .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
        validateOwner(reservation, userId);

        CourseSummaryResponse courseSummary = buildCourseSummary(reservation.getCourse(), userId);

        Payment payment =
                paymentRepository
                        .findTopByReservationIdAndStatusOrderByPaidAtDesc(
                                reservationId, PaymentStatus.PAID)
                        .orElse(null);
        ReservationPaymentInfo paymentInfo =
                payment != null ? ReservationPaymentInfo.from(payment) : null;

        return ReservationDetailResponse.from(reservation, courseSummary, paymentInfo);
    }

    @Transactional
    public Long createReservation(Long userId, CreateReservationRequest request) {
        validateDepartureDateTime(request.getDepartureDate(), request.getDepartureTime());
        validateDepartureLocation(request.getDeparture(), request.getLat(), request.getLng());

        // 확정된 예약은 같은 출발 일시에 중복 불가 (코스 무관)
        if (reservationRepository.existsByUserIdAndDepartureDateAndDepartureTimeAndStatusIn(
                userId, request.getDepartureDate(), request.getDepartureTime(), CONFIRMED_ONLY)) {
            throw new CustomException(ErrorCode.ALREADY_RESERVED);
        }

        // 결제 전 PENDING만 있는 경우: 결제 창을 닫고 다시 누르면 동일 요청이 반복되므로 기존 예약 ID 재사용
        Optional<Reservation> pendingSameSlot =
                reservationRepository
                        .findFirstByUserIdAndDepartureDateAndDepartureTimeAndStatusOrderByIdDesc(
                                userId,
                                request.getDepartureDate(),
                                request.getDepartureTime(),
                                ReservationStatus.PENDING);
        if (pendingSameSlot.isPresent()) {
            Reservation pending = pendingSameSlot.get();
            if (!pending.getCourse().getId().equals(request.getCourseId())) {
                throw new CustomException(ErrorCode.ALREADY_RESERVED);
            }
            if (paymentRepository.existsByReservationIdAndStatus(
                    pending.getId(), PaymentStatus.PAID)) {
                throw new CustomException(ErrorCode.ALREADY_RESERVED);
            }
            log.info("예약 재사용(동일 일시·코스, 미결제): reservationId={}, userId={}", pending.getId(), userId);
            return pending.getId();
        }

        Course course =
                courseRepository
                        .findById(request.getCourseId())
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        Reservation reservation =
                Reservation.builder()
                        .departure(request.getDeparture())
                        .departureLat(request.getLat())
                        .departureLng(request.getLng())
                        .departureDate(request.getDepartureDate())
                        .departureTime(request.getDepartureTime())
                        .headCount(request.getHeadCount())
                        .course(course)
                        .user(user)
                        .build();

        Long savedId = reservationRepository.save(reservation).getId();
        log.info(
                "예약 생성: reservationId={}, userId={}, courseId={}",
                savedId,
                userId,
                request.getCourseId());
        return savedId;
    }

    @Transactional
    public void updateReservation(
            Long userId, Long reservationId, UpdateReservationRequest request) {
        Reservation reservation =
                reservationRepository
                        .findById(reservationId)
                        .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
        validateOwner(reservation, userId);

        LocalDate newDate =
                request.getDepartureDate() != null
                        ? request.getDepartureDate()
                        : reservation.getDepartureDate();
        LocalTime newTime =
                request.getDepartureTime() != null
                        ? request.getDepartureTime()
                        : reservation.getDepartureTime();

        validateDepartureDateTime(newDate, newTime);
        validateDepartureLocation(request.getDeparture(), request.getLat(), request.getLng());

        // 같은 날짜·시간에 다른 활성 예약 중복 방지
        if (reservationRepository.existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNot(
                userId, newDate, newTime, ACTIVE_STATUSES, reservationId)) {
            throw new CustomException(ErrorCode.ALREADY_RESERVED);
        }

        reservation.update(request);
        log.info("예약 수정: reservationId={}", reservationId);
    }

    @Transactional
    public void cancelReservation(Long userId, Long reservationId) {
        Reservation reservation =
                reservationRepository
                        .findById(reservationId)
                        .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
        validateOwner(reservation, userId);
        reservation.cancel();
        log.info("예약 취소: reservationId={}", reservationId);
    }

    private void validateOwner(Reservation reservation, Long userId) {
        if (!reservation.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }

    private CourseSummaryResponse buildCourseSummary(Course course, Long userId) {
        List<CourseBakery> courseBakeries = course.getCourseBakeries();
        List<Long> bakeryIds = courseBakeries.stream().map(cb -> cb.getBakery().getId()).toList();
        Map<Long, String> thumbnailMap =
                bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(bakeryIds, 1).stream()
                        .collect(
                                Collectors.toMap(
                                        img -> img.getBakery().getId(),
                                        BakeryImage::getImageUrl,
                                        (a, b) -> a));
        List<CourseBakerySummary> bakeries =
                courseBakeries.stream()
                        .map(
                                cb ->
                                        CourseBakerySummary.from(
                                                cb.getBakery(),
                                                thumbnailMap.get(cb.getBakery().getId())))
                        .toList();
        int likeCount = (int) courseLikeRepository.countByCourse(course);
        boolean liked = courseLikeRepository.existsByCourseIdAndUserId(course.getId(), userId);
        return CourseSummaryResponse.from(course, likeCount, liked, false, bakeries);
    }

    private void validateDepartureDateTime(LocalDate departureDate, LocalTime departureTime) {
        if (departureDate == null || departureTime == null) {
            return;
        }

        int minute = departureTime.getMinute();
        if (minute != 0 && minute != 30) {
            throw new CustomException(ErrorCode.INVALID_RESERVATION_TIME);
        }

        LocalDateTime departureDateTime = LocalDateTime.of(departureDate, departureTime);
        if (departureDateTime.isBefore(LocalDateTime.now())) {
            throw new CustomException(ErrorCode.INVALID_RESERVATION_TIME);
        }
    }

    private void validateDepartureLocation(String departure, Double lat, Double lng) {
        boolean hasDeparture = departure != null;
        boolean hasLat = lat != null;
        boolean hasLng = lng != null;

        if (hasDeparture || hasLat || hasLng) {
            if (!(hasDeparture && hasLat && hasLng)) {
                throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
            }
        }
    }
}

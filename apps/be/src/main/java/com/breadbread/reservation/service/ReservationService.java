package com.breadbread.reservation.service;

import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.service.BakeryImageUrlResolver;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
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
    private final BakeryImageUrlResolver bakeryImageUrlResolver;

    static final Set<ReservationStatus> ACTIVE_STATUSES =
            Set.of(
                    ReservationStatus.PENDING,
                    ReservationStatus.CONFIRMED,
                    ReservationStatus.IN_PROGRESS);

    @Transactional(readOnly = true)
    public List<ReservationSummaryResponse> getMyReservations(
            Long userId, ReservationStatus status) {
        List<Reservation> reservations =
                status != null
                        ? reservationRepository
                                .findAllByUserIdAndStatusAndActiveOrderByCreatedAtDesc(
                                        userId, status, true)
                        : reservationRepository.findAllByUserIdAndActiveOrderByCreatedAtDesc(
                                userId, true);
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

        // 같은 출발 일시에 PENDING·CONFIRMED 예약 모두 중복 불가
        if (reservationRepository
                .existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndActiveTrue(
                        userId,
                        request.getDepartureDate(),
                        request.getDepartureTime(),
                        ACTIVE_STATUSES)) {
            throw new CustomException(ErrorCode.ALREADY_RESERVED);
        }

        Course course =
                courseRepository
                        .findByIdAndActiveTrue(request.getCourseId())
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

        try {
            Long savedId = reservationRepository.saveAndFlush(reservation).getId();
            log.info(
                    "예약 생성: reservationId={}, userId={}, courseId={}",
                    savedId,
                    userId,
                    request.getCourseId());
            return savedId;
        } catch (DataIntegrityViolationException e) {
            log.warn(
                    "[예약 생성 중복 또는 무결성 위반] userId={}, courseId={}, msg={}",
                    userId,
                    request.getCourseId(),
                    e.getMessage());
            throw new CustomException(ErrorCode.ALREADY_RESERVED);
        }
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
        if (reservationRepository
                .existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNotAndActiveTrue(
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

    @Transactional
    public void deleteReservation(Long userId, Long reservationId) {
        Reservation reservation =
                reservationRepository
                        .findById(reservationId)
                        .orElseThrow(() -> new CustomException(ErrorCode.RESERVATION_NOT_FOUND));
        validateOwner(reservation, userId);
        reservation.deactivate();
        log.info("예약 삭제: reservationId={}", reservationId);
    }

    private void validateOwner(Reservation reservation, Long userId) {
        if (!reservation.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }

    private CourseSummaryResponse buildCourseSummary(Course course, Long userId) {
        List<CourseBakery> courseBakeries = course.getCourseBakeries();
        List<Long> bakeryIds = courseBakeries.stream().map(cb -> cb.getBakery().getId()).toList();
        Map<Long, String> thumbnailMap = new HashMap<>();
        bakeryImageRepository
                .findAllByBakeryIdInAndDisplayOrder(bakeryIds, 1)
                .forEach(
                        img -> {
                            String url = bakeryImageUrlResolver.resolve(img);
                            if (url != null) thumbnailMap.putIfAbsent(img.getBakery().getId(), url);
                        });
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

    @Transactional(readOnly = true)
    public UnavailableTimesResponse getUnavailableTimes(Long userId, LocalDate date) {
        List<String> unavailableTimes =
                reservationRepository
                        .findBookedTimesByUserAndDate(userId, date, ACTIVE_STATUSES)
                        .stream()
                        .sorted()
                        .map(t -> t.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")))
                        .toList();
        return new UnavailableTimesResponse(unavailableTimes);
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

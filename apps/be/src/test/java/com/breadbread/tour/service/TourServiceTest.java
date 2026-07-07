package com.breadbread.tour.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BusinessHours;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.client.CongestionInstantCheckClient;
import com.breadbread.tour.dto.CongestionInstantCheckRequest;
import com.breadbread.tour.dto.CongestionInstantCheckResponse;
import com.breadbread.tour.dto.TourCurrentResponse;
import com.breadbread.tour.dto.TourStartResponse;
import com.breadbread.tour.dto.TourVisitResponse;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TourServiceTest {

    @InjectMocks private TourService tourService;
    @Mock private TourRedisService tourRedisService;
    @Mock private CourseRepository courseRepository;
    @Mock private CourseBakeryRepository courseBakeryRepository;
    @Mock private ReservationRepository reservationRepository;
    @Mock private UserRepository userRepository;
    @Mock private CongestionInstantCheckClient congestionInstantCheckClient;

    // ── startTour ──────────────────────────────────────────────────────────────

    @Test
    void startTour_throws_TOUR_ALREADY_STARTED_when_active_tour_exists() {
        when(tourRedisService.hasActiveTour(1L)).thenReturn(true);

        assertThatThrownBy(() -> tourService.startTour(1L, UserRole.ROLE_USER, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_ALREADY_STARTED);

        verify(courseRepository, never()).findByIdAndActiveTrue(any());
    }

    @Test
    void startTour_throws_COURSE_NOT_FOUND_when_course_missing_or_inactive() {
        when(tourRedisService.hasActiveTour(1L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tourService.startTour(1L, UserRole.ROLE_USER, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void startTour_throws_FORBIDDEN_when_private_course_and_not_owner() {
        Course course = privateCourse(10L, 99L);
        when(tourRedisService.hasActiveTour(1L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> tourService.startTour(1L, UserRole.ROLE_USER, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void startTour_throws_FORBIDDEN_when_private_course_and_owner_is_null() {
        Course course = privateCourseNullOwner(10L);
        when(tourRedisService.hasActiveTour(1L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> tourService.startTour(1L, UserRole.ROLE_USER, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void startTour_succeeds_when_private_course_and_is_owner() {
        Course course = privateCourse(10L, 1L); // userId == ownerId
        TourStateCache state = tourState(1L, 10L, 3, 0, TourStatus.IN_PROGRESS);
        when(tourRedisService.hasActiveTour(1L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(course));
        List<CourseBakery> courseBakeries =
                List.of(openCourseBakery(), openCourseBakery(), openCourseBakery());
        when(courseBakeryRepository.findAllByCourseIdWithBakery(10L)).thenReturn(courseBakeries);
        when(tourRedisService.startTour(1L, 10L, 3)).thenReturn(state);
        when(reservationRepository.findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        eq(1L), eq(10L), any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(Optional.empty());

        TourStartResponse response = tourService.startTour(1L, UserRole.ROLE_USER, 10L);

        assertThat(response.getCourseId()).isEqualTo(10L);
        assertThat(response.getStatus()).isEqualTo(TourStatus.IN_PROGRESS);
    }

    @Test
    void startTour_succeeds_when_private_course_and_is_admin() {
        Course course = privateCourse(10L, 99L); // 다른 유저 소유지만 ADMIN
        TourStateCache state = tourState(5L, 10L, 2, 0, TourStatus.IN_PROGRESS);
        when(tourRedisService.hasActiveTour(5L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(course));
        List<CourseBakery> courseBakeries = List.of(openCourseBakery(), openCourseBakery());
        when(courseBakeryRepository.findAllByCourseIdWithBakery(10L)).thenReturn(courseBakeries);
        when(tourRedisService.startTour(5L, 10L, 2)).thenReturn(state);
        when(reservationRepository.findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        eq(5L), eq(10L), any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(Optional.empty());

        TourStartResponse response = tourService.startTour(5L, UserRole.ROLE_ADMIN, 10L);

        assertThat(response.getCourseId()).isEqualTo(10L);
    }

    @Test
    void startTour_throws_COURSE_BAKERY_REQUIRED_when_course_has_no_bakeries() {
        Course course = sharedCourse(10L);
        when(tourRedisService.hasActiveTour(1L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseIdWithBakery(10L)).thenReturn(List.of());

        assertThatThrownBy(() -> tourService.startTour(1L, UserRole.ROLE_USER, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_BAKERY_REQUIRED);
    }

    @Test
    void startTour_succeeds_when_bakery_hours_undefined() {
        // 카카오/구글 임포트 등으로 영업시간이 미설정인 빵집은 "닫힘"이 아니라 "모름"으로 보고 통과시켜야 함
        Course course = sharedCourse(10L);
        TourStateCache state = tourState(1L, 10L, 1, 0, TourStatus.IN_PROGRESS);
        when(tourRedisService.hasActiveTour(1L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(course));
        CourseBakery undefinedHoursBakery = courseBakeryWithHours(false, false);
        when(courseBakeryRepository.findAllByCourseIdWithBakery(10L))
                .thenReturn(List.of(undefinedHoursBakery));
        when(tourRedisService.startTour(1L, 10L, 1)).thenReturn(state);
        when(reservationRepository.findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        eq(1L), eq(10L), any(LocalDate.class), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(Optional.empty());

        TourStartResponse response = tourService.startTour(1L, UserRole.ROLE_USER, 10L);

        assertThat(response.getCourseId()).isEqualTo(10L);
    }

    @Test
    void startTour_throws_TOUR_BAKERY_CLOSED_when_bakery_closed_now() {
        Course course = sharedCourse(10L);
        when(tourRedisService.hasActiveTour(1L)).thenReturn(false);
        when(courseRepository.findByIdAndActiveTrue(10L)).thenReturn(Optional.of(course));
        CourseBakery closedBakery = courseBakeryWithHours(true, false);
        when(courseBakeryRepository.findAllByCourseIdWithBakery(10L))
                .thenReturn(List.of(closedBakery));

        assertThatThrownBy(() -> tourService.startTour(1L, UserRole.ROLE_USER, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_BAKERY_CLOSED);
    }

    // ── visitBakery ────────────────────────────────────────────────────────────

    @Test
    void visitBakery_throws_TOUR_NOT_FOUND_when_no_state() {
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tourService.visitBakery(1L, 10L, 1))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_NOT_FOUND);
    }

    @Test
    void visitBakery_throws_TOUR_NOT_FOUND_when_courseId_mismatch() {
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 1, TourStatus.IN_PROGRESS)));

        assertThatThrownBy(() -> tourService.visitBakery(1L, 99L, 2))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_NOT_FOUND);
    }

    @Test
    void visitBakery_throws_TOUR_ALREADY_COMPLETED_when_status_is_completed() {
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 3, TourStatus.COMPLETED)));

        assertThatThrownBy(() -> tourService.visitBakery(1L, 10L, 4))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_ALREADY_COMPLETED);
    }

    @Test
    void visitBakery_throws_TOUR_INVALID_VISIT_ORDER_when_skipping_order() {
        // currentVisitOrder=0 → 다음 순서는 1이어야 함, 2로 건너뛰기 시도
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 0, TourStatus.IN_PROGRESS)));

        assertThatThrownBy(() -> tourService.visitBakery(1L, 10L, 2))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_INVALID_VISIT_ORDER);
    }

    @Test
    void visitBakery_throws_TOUR_INVALID_VISIT_ORDER_when_going_backward() {
        // currentVisitOrder=2 → 다음 순서는 3이어야 함, 1로 되돌아가기 시도
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 2, TourStatus.IN_PROGRESS)));

        assertThatThrownBy(() -> tourService.visitBakery(1L, 10L, 1))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_INVALID_VISIT_ORDER);
    }

    @Test
    void visitBakery_returns_IN_PROGRESS_response_when_not_last_bakery() {
        TourStateCache updated = tourState(1L, 10L, 3, 1, TourStatus.IN_PROGRESS);
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 0, TourStatus.IN_PROGRESS)));
        when(tourRedisService.updateVisitOrder(1L, 1)).thenReturn(updated);

        TourVisitResponse response = tourService.visitBakery(1L, 10L, 1);

        assertThat(response.getCurrentVisitOrder()).isEqualTo(1);
        assertThat(response.getRemainingCount()).isEqualTo(2);
        assertThat(response.getStatus()).isEqualTo(TourStatus.IN_PROGRESS);
    }

    @Test
    void visitBakery_returns_COMPLETED_response_when_last_bakery() {
        TourStateCache updated = tourState(1L, 10L, 3, 3, TourStatus.COMPLETED);
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 2, TourStatus.IN_PROGRESS)));
        when(tourRedisService.updateVisitOrder(1L, 3)).thenReturn(updated);
        when(reservationRepository.findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        eq(1L), eq(10L), any(LocalDate.class), eq(ReservationStatus.IN_PROGRESS)))
                .thenReturn(Optional.empty());

        TourVisitResponse response = tourService.visitBakery(1L, 10L, 3);

        assertThat(response.getCurrentVisitOrder()).isEqualTo(3);
        assertThat(response.getRemainingCount()).isEqualTo(0);
        assertThat(response.getStatus()).isEqualTo(TourStatus.COMPLETED);
    }

    @Test
    void visitBakery_completes_reservation_and_increments_usage_when_last_bakery() {
        TourStateCache updated = tourState(1L, 10L, 3, 3, TourStatus.COMPLETED);
        Reservation reservation = mock(Reservation.class);
        User user = mock(User.class);
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 2, TourStatus.IN_PROGRESS)));
        when(tourRedisService.updateVisitOrder(1L, 3)).thenReturn(updated);
        when(reservationRepository.findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        eq(1L), eq(10L), any(LocalDate.class), eq(ReservationStatus.IN_PROGRESS)))
                .thenReturn(Optional.of(reservation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        tourService.visitBakery(1L, 10L, 3);

        verify(reservation).complete();
        verify(user).incrementUsage();
    }

    // ── getCurrentTour ─────────────────────────────────────────────────────────

    @Test
    void getCurrentTour_returns_null_when_no_state() {
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());

        TourCurrentResponse response = tourService.getCurrentTour(1L);

        assertThat(response).isNull();
    }

    @Test
    void getCurrentTour_returns_response_with_correct_remaining_count() {
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 1, TourStatus.IN_PROGRESS)));

        TourCurrentResponse response = tourService.getCurrentTour(1L);

        assertThat(response.getCourseId()).isEqualTo(10L);
        assertThat(response.getCurrentVisitOrder()).isEqualTo(1);
        assertThat(response.getRemainingCount()).isEqualTo(2);
        assertThat(response.getStatus()).isEqualTo(TourStatus.IN_PROGRESS);
    }

    // ── completeTour ───────────────────────────────────────────────────────────

    @Test
    void completeTour_throws_TOUR_NOT_FOUND_when_no_state() {
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tourService.completeTour(1L, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_NOT_FOUND);
    }

    @Test
    void completeTour_throws_TOUR_NOT_FOUND_when_courseId_mismatch() {
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 1, TourStatus.IN_PROGRESS)));

        assertThatThrownBy(() -> tourService.completeTour(1L, 99L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_NOT_FOUND);
    }

    @Test
    void completeTour_throws_TOUR_ALREADY_COMPLETED_when_already_done() {
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 3, TourStatus.COMPLETED)));

        assertThatThrownBy(() -> tourService.completeTour(1L, 10L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TOUR_ALREADY_COMPLETED);
    }

    @Test
    void completeTour_sets_remainingCount_zero_regardless_of_current_visit_order() {
        // 1번만 방문한 상태에서 강제 완료 → currentVisitOrder=total=3, remainingCount=0
        TourStateCache afterComplete = tourState(1L, 10L, 3, 3, TourStatus.COMPLETED);
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 1, TourStatus.IN_PROGRESS)));
        when(tourRedisService.completeTour(1L)).thenReturn(afterComplete);
        when(reservationRepository.findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        eq(1L), eq(10L), any(LocalDate.class), eq(ReservationStatus.IN_PROGRESS)))
                .thenReturn(Optional.empty());

        TourCurrentResponse response = tourService.completeTour(1L, 10L);

        assertThat(response.getStatus()).isEqualTo(TourStatus.COMPLETED);
        assertThat(response.getRemainingCount()).isEqualTo(0);
        assertThat(response.getCurrentVisitOrder()).isEqualTo(3);
    }

    @Test
    void
            completeTour_completes_reservation_and_increments_usage_when_in_progress_reservation_exists() {
        TourStateCache afterComplete = tourState(1L, 10L, 3, 3, TourStatus.COMPLETED);
        Reservation reservation = mock(Reservation.class);
        User user = mock(User.class);
        when(tourRedisService.getTourState(1L))
                .thenReturn(Optional.of(tourState(1L, 10L, 3, 3, TourStatus.IN_PROGRESS)));
        when(tourRedisService.completeTour(1L)).thenReturn(afterComplete);
        when(reservationRepository.findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
                        eq(1L), eq(10L), any(LocalDate.class), eq(ReservationStatus.IN_PROGRESS)))
                .thenReturn(Optional.of(reservation));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        tourService.completeTour(1L, 10L);

        verify(reservation).complete();
        verify(user).incrementUsage();
    }

    // ── checkCongestionInstant ─────────────────────────────────────────────────

    @Test
    void checkCongestionInstant_passes_userId_and_request_to_client() {
        CongestionInstantCheckRequest request = mock(CongestionInstantCheckRequest.class);
        CongestionInstantCheckResponse response = mock(CongestionInstantCheckResponse.class);
        when(request.getCourseId()).thenReturn(10L);
        when(request.getBakeryIds()).thenReturn(List.of(1L, 2L, 3L));
        when(request.getTargetBakeryId()).thenReturn(null);
        when(congestionInstantCheckClient.check(any())).thenReturn(response);

        CongestionInstantCheckResponse result = tourService.checkCongestionInstant(1L, request);

        assertThat(result).isSameAs(response);
        verify(congestionInstantCheckClient).check(any());
    }

    @Test
    void checkCongestionInstant_includes_targetBakeryId_when_present() {
        CongestionInstantCheckRequest request = mock(CongestionInstantCheckRequest.class);
        CongestionInstantCheckResponse response = mock(CongestionInstantCheckResponse.class);
        when(request.getCourseId()).thenReturn(10L);
        when(request.getBakeryIds()).thenReturn(List.of(1L, 2L));
        when(request.getTargetBakeryId()).thenReturn(1L);
        when(congestionInstantCheckClient.check(any())).thenReturn(response);

        tourService.checkCongestionInstant(1L, request);

        ArgumentCaptor<java.util.Map> captor = ArgumentCaptor.forClass(java.util.Map.class);
        verify(congestionInstantCheckClient).check(captor.capture());
        assertThat(captor.getValue()).containsKey("targetBakeryId");
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private static TourStateCache tourState(
            Long userId, Long courseId, int total, int current, TourStatus status) {
        return TourStateCache.builder()
                .userId(userId)
                .courseId(courseId)
                .totalBakeryCount(total)
                .currentVisitOrder(current)
                .status(status)
                .startedAt("2026-01-01T10:00:00")
                .build();
    }

    /** shared=true인 코스 목(공개 코스 — 소유자 체크 불필요) */
    private static Course sharedCourse(long courseId) {
        Course course = mock(Course.class);
        when(course.isShared()).thenReturn(true);
        when(course.getId()).thenReturn(courseId);
        return course;
    }

    /** shared=false인 코스 목(비공개 코스 — 소유자 ownerId) */
    private static Course privateCourse(long courseId, long ownerId) {
        User owner = mock(User.class);
        when(owner.getId()).thenReturn(ownerId);
        Course course = mock(Course.class);
        when(course.isShared()).thenReturn(false);
        when(course.getUser()).thenReturn(owner);
        when(course.getId()).thenReturn(courseId);
        return course;
    }

    /** shared=false이고 user == null인 코스 목(데이터 이상 케이스) */
    private static Course privateCourseNullOwner(long courseId) {
        Course course = mock(Course.class);
        when(course.isShared()).thenReturn(false);
        when(course.getUser()).thenReturn(null);
        when(course.getId()).thenReturn(courseId);
        return course;
    }

    /** businessHours가 없어(null) 영업시간 체크에서 걸러지는(=항상 영업 중 취급되는) CourseBakery 목 */
    private static CourseBakery openCourseBakery() {
        Bakery bakery = mock(Bakery.class);
        CourseBakery courseBakery = mock(CourseBakery.class);
        when(courseBakery.getBakery()).thenReturn(bakery);
        return courseBakery;
    }

    /** hasDefinedHours/isOpenNow 결과를 직접 제어하는 CourseBakery 목(시간대 의존 없이 검증) */
    private static CourseBakery courseBakeryWithHours(boolean hasDefinedHours, boolean isOpen) {
        BusinessHours hours = mock(BusinessHours.class);
        when(hours.hasDefinedHours(any())).thenReturn(hasDefinedHours);
        when(hours.isOpenNow(any(), any(), any())).thenReturn(isOpen);
        Bakery bakery = mock(Bakery.class);
        when(bakery.getBusinessHours()).thenReturn(hours);
        CourseBakery courseBakery = mock(CourseBakery.class);
        when(courseBakery.getBakery()).thenReturn(bakery);
        return courseBakery;
    }
}

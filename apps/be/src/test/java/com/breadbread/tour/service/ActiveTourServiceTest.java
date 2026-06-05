package com.breadbread.tour.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import com.breadbread.reservation.repository.ReservationRepository;
import com.breadbread.tour.dto.ActiveTourResponse;
import com.breadbread.tour.redis.TourStateCache;
import com.breadbread.tour.redis.TourStatus;
import com.breadbread.user.entity.User;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ActiveTourServiceTest {

    @InjectMocks private ActiveTourService activeTourService;
    @Mock private TourRedisService tourRedisService;
    @Mock private CourseBakeryRepository courseBakeryRepository;
    @Mock private ReservationRepository reservationRepository;

    // ── getActiveTours - IN_PROGRESS ──────────────────────────────────────────

    @Test
    void getActiveTours_returns_inProgress_tours() {
        TourStateCache state =
                TourStateCache.builder()
                        .userId(1L)
                        .courseId(10L)
                        .currentVisitOrder(2)
                        .status(TourStatus.IN_PROGRESS)
                        .startedAt("2026-06-05T10:00:00")
                        .build();

        CourseBakery cb1 = courseBakery(1L);
        CourseBakery cb2 = courseBakery(2L);

        when(tourRedisService.getAllActiveUserIds()).thenReturn(List.of(1L));
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.of(state));
        when(courseBakeryRepository.findAllByCourseIdWithBakery(10L)).thenReturn(List.of(cb1, cb2));
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of());

        List<ActiveTourResponse> result = activeTourService.getActiveTours();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(1L);
        assertThat(result.get(0).getCourseId()).isEqualTo(10L);
        assertThat(result.get(0).getBakeryIds()).containsExactly(1L, 2L);
        assertThat(result.get(0).getCurrentVisitOrder()).isEqualTo(2);
        assertThat(result.get(0).getStatus()).isEqualTo("IN_PROGRESS");
    }

    @Test
    void getActiveTours_excludes_whenTourStateAbsent() {
        when(tourRedisService.getAllActiveUserIds()).thenReturn(List.of(1L));
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(reservationRepository.findTodayConfirmedWithCourse(any(), any()))
                .thenReturn(List.of());

        List<ActiveTourResponse> result = activeTourService.getActiveTours();

        assertThat(result).isEmpty();
    }

    // ── getActiveTours - PRE_DEPARTURE ────────────────────────────────────────

    @Test
    void getActiveTours_returns_preDeparture_whenWithinWindow() {
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Seoul"));
        LocalTime departure = now.plusMinutes(15);

        Reservation reservation = reservation(2L, 20L, departure);

        when(tourRedisService.getAllActiveUserIds()).thenReturn(List.of());
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservation));
        when(tourRedisService.hasActiveTour(2L)).thenReturn(false);

        List<ActiveTourResponse> result = activeTourService.getActiveTours();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getUserId()).isEqualTo(2L);
        assertThat(result.get(0).getStatus()).isEqualTo("PRE_DEPARTURE");
    }

    @Test
    void getActiveTours_excludes_preDeparture_whenOutsideWindow() {
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Seoul"));
        LocalTime departure = now.plusMinutes(60); // 창 밖

        Reservation reservation = reservation(2L, 20L, departure);

        when(tourRedisService.getAllActiveUserIds()).thenReturn(List.of());
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservation));

        List<ActiveTourResponse> result = activeTourService.getActiveTours();

        assertThat(result).isEmpty();
    }

    @Test
    void getActiveTours_excludes_preDeparture_whenAlreadyInProgress() {
        LocalTime now = LocalTime.now(ZoneId.of("Asia/Seoul"));
        LocalTime departure = now.plusMinutes(15);

        Reservation reservation = reservation(1L, 10L, departure);

        when(tourRedisService.getAllActiveUserIds()).thenReturn(List.of(1L));
        when(tourRedisService.getTourState(1L)).thenReturn(Optional.empty());
        when(reservationRepository.findTodayConfirmedWithCourse(
                        any(), eq(ReservationStatus.CONFIRMED)))
                .thenReturn(List.of(reservation));
        when(tourRedisService.hasActiveTour(1L)).thenReturn(true); // 이미 투어 중

        List<ActiveTourResponse> result = activeTourService.getActiveTours();

        assertThat(result).isEmpty();
    }

    @Test
    void getActiveTours_returnsEmpty_whenNoTours() {
        when(tourRedisService.getAllActiveUserIds()).thenReturn(List.of());
        when(reservationRepository.findTodayConfirmedWithCourse(any(), any()))
                .thenReturn(List.of());

        List<ActiveTourResponse> result = activeTourService.getActiveTours();

        assertThat(result).isEmpty();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static CourseBakery courseBakery(Long bakeryId) {
        Bakery bakery = mock(Bakery.class);
        when(bakery.getId()).thenReturn(bakeryId);
        CourseBakery cb = mock(CourseBakery.class);
        when(cb.getBakery()).thenReturn(bakery);
        return cb;
    }

    private static Reservation reservation(Long userId, Long courseId, LocalTime departureTime) {
        User user = mock(User.class);
        when(user.getId()).thenReturn(userId);

        Course course = mock(Course.class);
        when(course.getId()).thenReturn(courseId);
        when(course.getCourseBakeries()).thenReturn(List.of());

        Reservation reservation = mock(Reservation.class);
        when(reservation.getUser()).thenReturn(user);
        when(reservation.getCourse()).thenReturn(course);
        when(reservation.getDepartureTime()).thenReturn(departureTime);
        ReflectionTestUtils.setField(reservation, "id", userId);
        return reservation;
    }
}

package com.breadbread.course.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.course.client.DrivingRouteClient;
import com.breadbread.course.client.WalkingRouteClient;
import com.breadbread.course.dto.response.DrivingRouteResponse;
import com.breadbread.course.dto.route.Coordinate;
import com.breadbread.course.dto.route.RouteResult;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseDrivingRoute;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.course.entity.RouteMode;
import com.breadbread.course.entity.TravelType;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.entity.WaitingTolerance;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CourseDrivingRouteServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CourseDrivingRouteRepository courseDrivingRouteRepository;
    @Mock private CourseDrivingRouteSaver courseDrivingRouteSaver;
    @Mock private DrivingRouteClient drivingRouteClient;
    @Mock private WalkingRouteClient walkingRouteClient;

    @InjectMocks private CourseDrivingRouteService courseDrivingRouteService;

    @Test
    void getDrivingRoute_throws_whenCourseNotFound() {
        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseDrivingRouteService.getDrivingRoute(1L, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void getDrivingRoute_returns_cached_path_whenCacheHit() {
        Course course = manualCourse(1L, "공유코스");
        List<Coordinate> cachedPath =
                List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1));
        CourseDrivingRoute cached =
                CourseDrivingRoute.builder()
                        .courseId(1L)
                        .routeMode(RouteMode.DRIVING)
                        .path(cachedPath)
                        .build();

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(1L, RouteMode.DRIVING))
                .thenReturn(Optional.of(cached));

        DrivingRouteResponse response =
                courseDrivingRouteService.getDrivingRoute(1L, RouteMode.DRIVING);

        assertThat(response.getPath()).isEqualTo(cachedPath);
        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDrivingRoute_manual_fetchesAndSaves_whenCacheMiss() {
        Course course = manualCourse(1L, "공유코스");
        Bakery b1 = bakeryAt(10L, "A빵집", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B빵집", 36.1, 127.1);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(b1).build());
        course.addCourseBakery(CourseBakery.builder().visitOrder(2).bakery(b2).build());

        List<Coordinate> path = List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1));
        RouteResult routeResult = new RouteResult(path, List.of(), 600);

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(1L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);

        DrivingRouteResponse response =
                courseDrivingRouteService.getDrivingRoute(1L, RouteMode.DRIVING);

        assertThat(response.getPath()).isEqualTo(path);

        ArgumentCaptor<List<Coordinate>> coordCaptor = ArgumentCaptor.forClass(List.class);
        verify(drivingRouteClient).getPath(coordCaptor.capture());
        List<Coordinate> coords = coordCaptor.getValue();
        assertThat(coords).hasSize(2);
        assertThat(coords.get(0).getLat()).isEqualTo(36.0);
        assertThat(coords.get(0).getLng()).isEqualTo(127.0);

        verify(courseDrivingRouteSaver).save(eq(1L), eq(RouteMode.DRIVING), any(RouteResult.class));
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDrivingRoute_ai_prependsUserLocation_whenCacheMiss() {
        User owner = owner(1L);
        Course course = aiCourseWithLocation(2L, owner, 35.5, 126.5);
        Bakery bakery = bakeryAt(10L, "빵집", 36.0, 127.0);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());

        List<Coordinate> path = List.of(new Coordinate(35.5, 126.5), new Coordinate(36.0, 127.0));
        RouteResult routeResult = new RouteResult(path, List.of(), 600);

        when(courseRepository.findActiveWithBakeriesById(2L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(2L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);

        courseDrivingRouteService.getDrivingRoute(2L, RouteMode.DRIVING);

        ArgumentCaptor<List<Coordinate>> coordCaptor = ArgumentCaptor.forClass(List.class);
        verify(drivingRouteClient).getPath(coordCaptor.capture());
        List<Coordinate> coords = coordCaptor.getValue();
        assertThat(coords).hasSize(2);
        assertThat(coords.get(0).getLat()).isEqualTo(35.5);
        assertThat(coords.get(0).getLng()).isEqualTo(126.5);
        assertThat(coords.get(1).getLat()).isEqualTo(36.0);
    }

    @Test
    void getDrivingRoute_ai_succeeds_withOneBakery() {
        User owner = owner(1L);
        Course course = aiCourseWithLocation(2L, owner, 35.5, 126.5);
        Bakery bakery = bakeryAt(10L, "빵집", 36.0, 127.0);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());

        List<Coordinate> path = List.of(new Coordinate(35.5, 126.5), new Coordinate(36.0, 127.0));
        RouteResult routeResult = new RouteResult(path, List.of(), 600);

        when(courseRepository.findActiveWithBakeriesById(2L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(2L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);

        DrivingRouteResponse response =
                courseDrivingRouteService.getDrivingRoute(2L, RouteMode.DRIVING);

        assertThat(response.getPath()).isEqualTo(path);
        verify(drivingRouteClient).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenManualCourseHasOnlyOneBakery() {
        Course course = manualCourse(1L, "공유코스");
        Bakery bakery = bakeryAt(10L, "빵집", 36.0, 127.0);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(1L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseDrivingRouteService.getDrivingRoute(1L, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_INSUFFICIENT_WAYPOINTS);

        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenManualCourseExceedsWaypointLimit() {
        Course course = manualCourse(1L, "공유코스");
        for (int i = 0; i < 8; i++) {
            course.addCourseBakery(
                    CourseBakery.builder()
                            .visitOrder(i + 1)
                            .bakery(bakeryAt(10L + i, "빵집" + i, 36.0 + i * 0.01, 127.0 + i * 0.01))
                            .build());
        }

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(1L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseDrivingRouteService.getDrivingRoute(1L, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_TOO_MANY_WAYPOINTS);

        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenAiCourseExceedsWaypointLimit() {
        User owner = owner(1L);
        Course course = aiCourseWithLocation(2L, owner, 35.5, 126.5);
        for (int i = 0; i < 7; i++) {
            course.addCourseBakery(
                    CourseBakery.builder()
                            .visitOrder(i + 1)
                            .bakery(bakeryAt(10L + i, "빵집" + i, 36.0 + i * 0.01, 127.0 + i * 0.01))
                            .build());
        }

        when(courseRepository.findActiveWithBakeriesById(2L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(2L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseDrivingRouteService.getDrivingRoute(2L, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_TOO_MANY_WAYPOINTS);

        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenAiCourseHasNoAiInfo() {
        User owner = owner(1L);
        Course course = aiPrivateCourse(1L, owner);
        ReflectionTestUtils.setField(course, "aiCourseInfo", null);
        Bakery bakery = bakeryAt(10L, "빵집", 36.0, 127.0);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(1L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseDrivingRouteService.getDrivingRoute(1L, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);

        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_ignores_concurrent_save_conflict() {
        Course course = manualCourse(1L, "공유코스");
        Bakery b1 = bakeryAt(10L, "A빵집", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B빵집", 36.1, 127.1);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(b1).build());
        course.addCourseBakery(CourseBakery.builder().visitOrder(2).bakery(b2).build());

        List<Coordinate> path = List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1));
        RouteResult routeResult = new RouteResult(path, List.of(), 600);

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(1L, RouteMode.DRIVING))
                .thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);
        doThrow(new DataIntegrityViolationException("dup"))
                .when(courseDrivingRouteSaver)
                .save(eq(1L), eq(RouteMode.DRIVING), any(RouteResult.class));

        DrivingRouteResponse response =
                courseDrivingRouteService.getDrivingRoute(1L, RouteMode.DRIVING);

        assertThat(response.getPath()).isEqualTo(path);
    }

    @Test
    @SuppressWarnings("unchecked")
    void getDrivingRoute_walking_usesWalkingClient_andSavesWithWalkingMode() {
        Course course = manualCourse(1L, "공유코스");
        Bakery b1 = bakeryAt(10L, "A빵집", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B빵집", 36.1, 127.1);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(b1).build());
        course.addCourseBakery(CourseBakery.builder().visitOrder(2).bakery(b2).build());

        List<Coordinate> path = List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1));
        RouteResult routeResult = new RouteResult(path, List.of(), 900);

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findByIdCourseIdAndIdRouteMode(1L, RouteMode.WALKING))
                .thenReturn(Optional.empty());
        when(walkingRouteClient.getPath(any())).thenReturn(routeResult);

        DrivingRouteResponse response =
                courseDrivingRouteService.getDrivingRoute(1L, RouteMode.WALKING);

        assertThat(response.getPath()).isEqualTo(path);
        verify(walkingRouteClient).getPath(any());
        verify(drivingRouteClient, never()).getPath(any());
        verify(courseDrivingRouteSaver).save(eq(1L), eq(RouteMode.WALKING), any(RouteResult.class));
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────

    private static Course manualCourse(long id, String name) {
        BreadType bt = BreadType.BREAD;
        ManualCourseInfo info = ManualCourseInfo.builder().editorPick(false).breadType(bt).build();
        Course course = Course.createManual(name, null, "1h", 1000L, "테마", "서울", info);
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static Course aiPrivateCourse(long id, User owner) {
        AiCourseInfo aiInfo =
                AiCourseInfo.builder()
                        .travelType(TravelType.ALONE)
                        .budgetRange(BudgetRange.ANY)
                        .waitingPreference(false)
                        .drinkPreference(false)
                        .bakeryCount(2)
                        .flexibilityLevel(FlexibilityLevel.ACTIVE)
                        .recommendReason("r")
                        .minimizeRoute(false)
                        .latitude(0)
                        .longitude(0)
                        .build();
        Course course = Course.createAi("AI 코스", owner, emptyPreference(owner), aiInfo, Set.of());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static Course aiCourseWithLocation(long id, User owner, double lat, double lng) {
        AiCourseInfo aiInfo =
                AiCourseInfo.builder()
                        .travelType(TravelType.ALONE)
                        .budgetRange(BudgetRange.ANY)
                        .waitingPreference(false)
                        .drinkPreference(false)
                        .bakeryCount(1)
                        .flexibilityLevel(FlexibilityLevel.ACTIVE)
                        .recommendReason("r")
                        .minimizeRoute(false)
                        .latitude(lat)
                        .longitude(lng)
                        .build();
        Course course = Course.createAi("AI 코스", owner, emptyPreference(owner), aiInfo, Set.of());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static UserPreference emptyPreference(User user) {
        return UserPreference.builder()
                .bakeryTypes(List.of())
                .bakeryPersonalities(List.of())
                .bakeryUseTypes(List.of())
                .waitingTolerance(WaitingTolerance.NO_WAIT)
                .user(user)
                .build();
    }

    private static User owner(long id) {
        User u =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n")
                        .nickname("nick" + id)
                        .email(id + "@e.com")
                        .phone("010" + id)
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private static Bakery bakeryAt(long id, String name, double lat, double lng) {
        Bakery b =
                Bakery.builder()
                        .name(name)
                        .address("addr")
                        .region("서울")
                        .latitude(lat)
                        .longitude(lng)
                        .phone("010")
                        .rating(4.0)
                        .mapLink("m")
                        .dineInAvailable(true)
                        .parkingAvailable(false)
                        .drinkAvailable(true)
                        .note("")
                        .build();
        ReflectionTestUtils.setField(b, "id", id);
        return b;
    }
}

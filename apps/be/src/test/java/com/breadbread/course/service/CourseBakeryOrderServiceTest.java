package com.breadbread.course.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.course.dto.request.ReorderBakeriesRequest;
import com.breadbread.course.dto.response.DrivingRouteResponse;
import com.breadbread.course.dto.response.ReorderBakeriesResponse;
import com.breadbread.course.dto.route.Coordinate;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.course.entity.RouteMode;
import com.breadbread.course.entity.TravelType;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.service.ai.AiCourseRouteOptimizer;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.service.TourRedisService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CourseBakeryOrderServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CourseBakeryRepository courseBakeryRepository;
    @Mock private CourseDrivingRouteService courseDrivingRouteService;
    @Mock private TourRedisService tourRedisService;
    @Mock private AiCourseRouteOptimizer aiCourseRouteOptimizer;

    @InjectMocks private CourseBakeryOrderService courseBakeryOrderService;

    @Test
    void reorderBakeries_throws_whenCourseNotFound() {
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.reorderBakeries(
                                        1L, 1L, UserRole.ROLE_ADMIN, reorderRequest(List.of(10L))))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void reorderBakeries_throws_whenForbidden() {
        Course course = manualCourse(1L, "코스"); // user == null
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.reorderBakeries(
                                        1L, 99L, UserRole.ROLE_USER, reorderRequest(List.of(10L))))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void reorderBakeries_throws_whenBakeryOrderEmpty() {
        Course course = manualCourse(1L, "코스");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.reorderBakeries(
                                        1L, 99L, UserRole.ROLE_ADMIN, reorderRequest(List.of())))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void reorderBakeries_throws_whenDuplicateIds() {
        Course course = manualCourse(1L, "코스");
        Bakery b1 = bakeryAt(10L, "A", 36.0, 127.0);
        CourseBakery cb1 = CourseBakery.builder().visitOrder(1).bakery(b1).build();
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L)).thenReturn(List.of(cb1));

        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.reorderBakeries(
                                        1L,
                                        99L,
                                        UserRole.ROLE_ADMIN,
                                        reorderRequest(List.of(10L, 10L))))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void reorderBakeries_throws_whenCountMismatch() {
        Course course = manualCourse(1L, "코스");
        Bakery b1 = bakeryAt(10L, "A", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B", 36.1, 127.1);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L))
                .thenReturn(
                        List.of(
                                CourseBakery.builder().visitOrder(1).bakery(b1).build(),
                                CourseBakery.builder().visitOrder(2).bakery(b2).build()));

        // 활성 빵집은 2개인데 1개만 보냄
        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.reorderBakeries(
                                        1L, 99L, UserRole.ROLE_ADMIN, reorderRequest(List.of(10L))))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_ORDER_COUNT_MISMATCH);
    }

    @Test
    void reorderBakeries_updatesVisitOrder_andReturnsResponse() {
        Course course = manualCourse(1L, "코스");
        Bakery b1 = bakeryAt(10L, "A", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B", 36.1, 127.1);
        CourseBakery cb1 = CourseBakery.builder().visitOrder(1).bakery(b1).build();
        CourseBakery cb2 = CourseBakery.builder().visitOrder(2).bakery(b2).build();

        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L)).thenReturn(List.of(cb1, cb2));

        List<Coordinate> path = List.of(new Coordinate(36.1, 127.1), new Coordinate(36.0, 127.0));
        DrivingRouteResponse routeResponse =
                DrivingRouteResponse.builder()
                        .path(path)
                        .legs(List.of())
                        .stayMinutesPerBakery(List.of(20, 20))
                        .totalTravelMinutes(10)
                        .totalStayMinutes(40)
                        .totalMinutes(50)
                        .build();
        when(courseDrivingRouteService.fetchAndSaveRoute(
                        any(Course.class), anyList(), anyList(), anyInt(), any()))
                .thenReturn(routeResponse);

        // 순서 뒤집기: [20, 10]
        ReorderBakeriesResponse response =
                courseBakeryOrderService.reorderBakeries(
                        1L, 99L, UserRole.ROLE_ADMIN, reorderRequest(List.of(20L, 10L)));

        assertThat(response.getCourseId()).isEqualTo(1L);
        assertThat(response.getBakeryOrder()).containsExactly(20L, 10L);
        assertThat(cb2.getVisitOrder()).isEqualTo(1); // 20L → 1순위
        assertThat(cb1.getVisitOrder()).isEqualTo(2); // 10L → 2순위
        verify(courseDrivingRouteService).invalidateCache(1L);
    }

    @Test
    void reorderBakeries_filtersInactiveIds_andProceedsWhenActiveSetMatches() {
        Course course = manualCourse(1L, "코스");
        Bakery b1 = bakeryAt(10L, "A", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B", 36.1, 127.1);
        CourseBakery cb1 = CourseBakery.builder().visitOrder(1).bakery(b1).build();
        CourseBakery cb2 = CourseBakery.builder().visitOrder(2).bakery(b2).build();

        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L)).thenReturn(List.of(cb1, cb2));

        List<Coordinate> path = List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1));
        DrivingRouteResponse routeResponse =
                DrivingRouteResponse.builder()
                        .path(path)
                        .legs(List.of())
                        .stayMinutesPerBakery(List.of(20, 20))
                        .totalTravelMinutes(10)
                        .totalStayMinutes(40)
                        .totalMinutes(50)
                        .build();
        when(courseDrivingRouteService.fetchAndSaveRoute(
                        any(Course.class), anyList(), anyList(), anyInt(), any()))
                .thenReturn(routeResponse);

        // 비활성 ID 999는 필터링 후 활성 [10, 20]과 일치 → 성공
        ReorderBakeriesResponse response =
                courseBakeryOrderService.reorderBakeries(
                        1L, 99L, UserRole.ROLE_ADMIN, reorderRequest(List.of(999L, 10L, 20L)));

        assertThat(response.getBakeryOrder()).containsExactly(10L, 20L);
    }

    // ── optimizeBakeryOrder ───────────────────────────────────────────────

    @Test
    void optimizeBakeryOrder_throws_whenCourseNotFound() {
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.optimizeBakeryOrder(
                                        1L, 1L, UserRole.ROLE_USER, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void optimizeBakeryOrder_throws_whenManualCourse() {
        Course course = manualCourse(1L, "수동코스");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.optimizeBakeryOrder(
                                        1L, 99L, UserRole.ROLE_ADMIN, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void optimizeBakeryOrder_throws_whenForbidden() {
        User owner = owner(1L);
        Course course = aiCourse(1L, owner, 36.3, 127.3);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(
                        () ->
                                courseBakeryOrderService.optimizeBakeryOrder(
                                        1L, 99L, UserRole.ROLE_USER, RouteMode.DRIVING))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void optimizeBakeryOrder_appliesOptimizedOrder() {
        User owner = owner(1L);
        Course course = aiCourse(1L, owner, 36.3, 127.3);
        Bakery b1 = bakeryAt(10L, "A", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B", 36.1, 127.1);
        CourseBakery cb1 = CourseBakery.builder().visitOrder(1).bakery(b1).build();
        CourseBakery cb2 = CourseBakery.builder().visitOrder(2).bakery(b2).build();

        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L)).thenReturn(List.of(cb1, cb2));
        when(aiCourseRouteOptimizer.optimizeOrder(
                        org.mockito.ArgumentMatchers.anyDouble(),
                        org.mockito.ArgumentMatchers.anyDouble(),
                        org.mockito.ArgumentMatchers.anyList(),
                        org.mockito.ArgumentMatchers.anyMap(),
                        any()))
                .thenReturn(List.of(20L, 10L)); // 최적화 결과: B → A

        List<Coordinate> path = List.of(new Coordinate(36.1, 127.1), new Coordinate(36.0, 127.0));
        DrivingRouteResponse routeResponse =
                DrivingRouteResponse.builder()
                        .path(path)
                        .legs(List.of())
                        .stayMinutesPerBakery(List.of(40, 40))
                        .totalTravelMinutes(10)
                        .totalStayMinutes(80)
                        .totalMinutes(90)
                        .build();
        when(courseDrivingRouteService.fetchAndSaveRoute(
                        any(Course.class), anyList(), anyList(), anyInt(), any()))
                .thenReturn(routeResponse);

        ReorderBakeriesResponse response =
                courseBakeryOrderService.optimizeBakeryOrder(
                        1L, 1L, UserRole.ROLE_USER, RouteMode.DRIVING);

        assertThat(response.getBakeryOrder()).containsExactly(20L, 10L);
        assertThat(cb2.getVisitOrder()).isEqualTo(1); // 20L(B) → 1순위
        assertThat(cb1.getVisitOrder()).isEqualTo(2); // 10L(A) → 2순위
        verify(courseDrivingRouteService).invalidateCache(1L);
    }

    @Test
    void optimizeBakeryOrder_passesRouteModeToFetchAndSaveRoute() {
        User owner = owner(1L);
        Course course = aiCourse(1L, owner, 36.3, 127.3);
        Bakery b1 = bakeryAt(10L, "A", 36.0, 127.0);
        Bakery b2 = bakeryAt(20L, "B", 36.1, 127.1);
        CourseBakery cb1 = CourseBakery.builder().visitOrder(1).bakery(b1).build();
        CourseBakery cb2 = CourseBakery.builder().visitOrder(2).bakery(b2).build();

        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L)).thenReturn(List.of(cb1, cb2));
        when(aiCourseRouteOptimizer.optimizeOrder(
                        org.mockito.ArgumentMatchers.anyDouble(),
                        org.mockito.ArgumentMatchers.anyDouble(),
                        org.mockito.ArgumentMatchers.anyList(),
                        org.mockito.ArgumentMatchers.anyMap(),
                        any()))
                .thenReturn(List.of(20L, 10L));

        List<Coordinate> path = List.of(new Coordinate(36.1, 127.1), new Coordinate(36.0, 127.0));
        DrivingRouteResponse routeResponse =
                DrivingRouteResponse.builder()
                        .path(path)
                        .legs(List.of())
                        .stayMinutesPerBakery(List.of(40, 40))
                        .totalTravelMinutes(10)
                        .totalStayMinutes(80)
                        .totalMinutes(90)
                        .build();
        when(courseDrivingRouteService.fetchAndSaveRoute(
                        any(Course.class), anyList(), anyList(), anyInt(), any()))
                .thenReturn(routeResponse);

        courseBakeryOrderService.optimizeBakeryOrder(1L, 1L, UserRole.ROLE_USER, RouteMode.WALKING);

        verify(courseDrivingRouteService)
                .fetchAndSaveRoute(
                        any(Course.class), anyList(), anyList(), anyInt(), eq(RouteMode.WALKING));
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────

    private static Course aiCourse(long id, User user, double lat, double lng) {
        AiCourseInfo aiInfo =
                AiCourseInfo.builder()
                        .travelType(TravelType.ALONE)
                        .budgetRange(BudgetRange.ANY)
                        .flexibilityLevel(FlexibilityLevel.MAINTAIN)
                        .latitude(lat)
                        .longitude(lng)
                        .bakeryCount(2)
                        .build();
        Course course =
                Course.createAi("AI코스", user, mockUserPreference(), aiInfo, java.util.Set.of());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static com.breadbread.user.entity.UserPreference mockUserPreference() {
        return com.breadbread.user.entity.UserPreference.builder()
                .bakeryTypes(java.util.List.of())
                .build();
    }

    private static Course manualCourse(long id, String name) {
        BreadType bt = BreadType.BREAD;
        ManualCourseInfo info = ManualCourseInfo.builder().editorPick(false).breadType(bt).build();
        Course course = Course.createManual(name, null, "1h", 1000L, "테마", "서울", info);
        ReflectionTestUtils.setField(course, "id", id);
        return course;
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

    private static ReorderBakeriesRequest reorderRequest(List<Long> bakeryOrder) {
        ReorderBakeriesRequest request = new ReorderBakeriesRequest();
        ReflectionTestUtils.setField(request, "bakeryOrder", bakeryOrder);
        return request;
    }
}

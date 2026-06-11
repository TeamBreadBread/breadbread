package com.breadbread.course.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.dto.request.CourseSearch;
import com.breadbread.course.dto.request.ManualCourseRequest;
import com.breadbread.course.dto.request.UpdateCourseRequest;
import com.breadbread.course.dto.response.CourseListResponse;
import com.breadbread.course.dto.response.RouteResponse;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseLike;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.course.entity.Route;
import com.breadbread.course.entity.TravelType;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseLikeRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.repository.RouteRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CourseServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private BakeryRepository bakeryRepository;
    @Mock private CourseBakeryRepository courseBakeryRepository;
    @Mock private CourseLikeRepository courseLikeRepository;
    @Mock private UserRepository userRepository;
    @Mock private RouteRepository routeRepository;
    @Mock private CourseDrivingRouteRepository courseDrivingRouteRepository;
    @Mock private CourseThumbnailAssembler courseSummaryAssembler;

    @InjectMocks private CourseService courseService;

    @Test
    void search_maps_likes_thumbnails_when_authenticated_user() {
        Course course = manualCourse(1L, "서울 코스");
        Bakery bakery = bakery(10L, "A빵집");
        CourseBakery cb = CourseBakery.builder().visitOrder(2).bakery(bakery).build();
        course.addCourseBakery(cb);

        Pageable pageable = PageRequest.of(0, 10);
        when(courseRepository.search(any(CourseSearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(course), pageable, 1));
        when(courseSummaryAssembler.buildThumbnailMap(List.of(10L)))
                .thenReturn(Map.of(10L, "thumb.jpg"));
        when(courseLikeRepository.countByCourseIdIn(List.of(1L)))
                .thenReturn(Collections.singletonList(new Object[] {1L, 3L}));
        when(courseLikeRepository.findLikedCourseIdsByUserId(List.of(1L), 99L))
                .thenReturn(List.of(1L));
        when(routeRepository.findLikedCourseIdsByUserId(List.of(1L), 99L)).thenReturn(List.of(1L));

        CourseListResponse result =
                courseService.search(CourseSearch.builder().build(), pageable, 99L);

        assertThat(result.getTotal()).isEqualTo(1);
        assertThat(result.getCourses()).hasSize(1);
        assertThat(result.getCourses().get(0).getLikeCount()).isEqualTo(3);
        assertThat(result.getCourses().get(0).isLiked()).isTrue();
        assertThat(result.getCourses().get(0).isSaved()).isTrue();
        assertThat(result.getCourses().get(0).getBakeries().get(0).getThumbnailUrl())
                .isEqualTo("thumb.jpg");
    }

    @Test
    void search_omits_liked_flags_when_user_anonymous() {
        Course course = manualCourse(2L, "코스");
        Pageable pageable = PageRequest.of(0, 5);
        when(courseRepository.search(any(CourseSearch.class), eq(pageable)))
                .thenReturn(new PageImpl<>(List.of(course), pageable, 1));
        when(courseLikeRepository.countByCourseIdIn(List.of(2L))).thenReturn(List.of());

        CourseListResponse result =
                courseService.search(CourseSearch.builder().build(), pageable, null);

        assertThat(result.getCourses().get(0).isLiked()).isFalse();
        assertThat(result.getCourses().get(0).isSaved()).isFalse();
        verify(courseLikeRepository, never()).findLikedCourseIdsByUserId(anyList(), any());
        verify(routeRepository, never()).findLikedCourseIdsByUserId(anyList(), any());
    }

    @Test
    void findOne_throws_whenCourseMissing() {
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.findOne(1L, 1L, UserRole.ROLE_USER))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void findOne_privateCourse_throwsUnauthorized_whenUserMissing() {
        Course course = aiPrivateCourse(5L, owner(1L));
        when(courseRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.findOne(5L, null, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.UNAUTHORIZED);
    }

    @Test
    void findOne_privateCourse_throwsForbidden_whenNotOwner() {
        Course course = aiPrivateCourse(5L, owner(1L));
        when(courseRepository.findByIdAndActiveTrue(5L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.findOne(5L, 2L, UserRole.ROLE_USER))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void findOne_returns_private_course_when_owner() {
        User owner = owner(1L);
        Course course = aiPrivateCourse(7L, owner);
        syncCourseBakeriesForDetail(course);

        when(courseRepository.findByIdAndActiveTrue(7L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseIdOrderByVisitOrder(7L))
                .thenReturn(new ArrayList<>(course.getCourseBakeries()));
        when(courseSummaryAssembler.buildThumbnailMap(anyList())).thenReturn(Map.of());
        when(courseLikeRepository.countByCourse(course)).thenReturn(0L);
        when(courseLikeRepository.existsByCourseIdAndUserId(7L, 1L)).thenReturn(false);
        when(routeRepository.existsByCourseIdAndUserId(7L, 1L)).thenReturn(true);

        var detail = courseService.findOne(7L, 1L, UserRole.ROLE_USER);

        assertThat(detail.getId()).isEqualTo(7L);
        assertThat(detail.getBakeries()).hasSize(1);
        assertThat(detail.isSaved()).isTrue();
    }

    @Test
    void findOne_returns_private_course_when_admin() {
        Course course = aiPrivateCourse(8L, owner(3L));
        syncCourseBakeriesForDetail(course);

        when(courseRepository.findByIdAndActiveTrue(8L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseIdOrderByVisitOrder(8L))
                .thenReturn(new ArrayList<>(course.getCourseBakeries()));
        when(courseSummaryAssembler.buildThumbnailMap(anyList())).thenReturn(Map.of());
        when(courseLikeRepository.countByCourse(course)).thenReturn(1L);
        when(courseLikeRepository.existsByCourseIdAndUserId(8L, 999L)).thenReturn(false);
        when(routeRepository.existsByCourseIdAndUserId(8L, 999L)).thenReturn(false);

        var detail = courseService.findOne(8L, 999L, UserRole.ROLE_ADMIN);

        assertThat(detail.getLikeCount()).isEqualTo(1);
        assertThat(detail.isSaved()).isFalse();
    }

    @Test
    void createManual_throws_whenNoBakeries() {
        ManualCourseRequest request = new ManualCourseRequest();
        ReflectionTestUtils.setField(request, "name", "코스");
        ReflectionTestUtils.setField(request, "bakeryIds", List.of());

        assertThatThrownBy(() -> courseService.createManual(1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_BAKERY_REQUIRED);
    }

    @Test
    void createManual_throws_whenDuplicateBakeryIds() {
        ManualCourseRequest request = manualRequest("코스", List.of(1L, 1L));
        when(courseRepository.save(any(Course.class)))
                .thenAnswer(
                        inv -> {
                            Course c = inv.getArgument(0);
                            ReflectionTestUtils.setField(c, "id", 100L);
                            return c;
                        });
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(1L, 1L), BakeryStatus.APPROVED))
                .thenReturn(List.of(bakery(1L, "B")));

        assertThatThrownBy(() -> courseService.createManual(1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void createManual_throws_whenBakeryMissing() {
        ManualCourseRequest request = manualRequest("코스", List.of(1L, 2L));
        when(courseRepository.save(any(Course.class)))
                .thenAnswer(
                        inv -> {
                            Course c = inv.getArgument(0);
                            ReflectionTestUtils.setField(c, "id", 100L);
                            return c;
                        });
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(1L, 2L), BakeryStatus.APPROVED))
                .thenReturn(List.of(bakery(1L, "B")));

        assertThatThrownBy(() -> courseService.createManual(1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void createManual_returns_course_id_when_bakeries_valid() {
        ManualCourseRequest request = manualRequest("새 코스", List.of(10L, 20L));
        Bakery b1 = bakery(10L, "첫");
        Bakery b2 = bakery(20L, "둘");
        when(courseRepository.save(any(Course.class)))
                .thenAnswer(
                        inv -> {
                            Course c = inv.getArgument(0);
                            ReflectionTestUtils.setField(c, "id", 55L);
                            return c;
                        });
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(10L, 20L), BakeryStatus.APPROVED))
                .thenReturn(List.of(b1, b2));

        Long id = courseService.createManual(9L, request);

        assertThat(id).isEqualTo(55L);
        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(captor.capture());
        Course saved = captor.getValue();
        assertThat(saved.getCourseBakeries()).hasSize(2);
        assertThat(saved.getCourseBakeries().get(0).getVisitOrder()).isEqualTo(1);
        assertThat(saved.getCourseBakeries().get(1).getVisitOrder()).isEqualTo(2);
    }

    @Test
    void updateManual_throws_whenBakeryListEmpty() {
        Course course = manualCourse(1L, "이름");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        UpdateCourseRequest request = new UpdateCourseRequest();
        ReflectionTestUtils.setField(request, "bakeryIds", List.of());

        assertThatThrownBy(() -> courseService.updateManual(1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_BAKERY_REQUIRED);
    }

    @Test
    void updateManual_replacesBakeries_whenIdsProvided() {
        Course course = manualCourse(3L, "수정");
        when(courseRepository.findByIdAndActiveTrue(3L)).thenReturn(Optional.of(course));
        Bakery b = bakery(30L, "새빵집");
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(30L), BakeryStatus.APPROVED))
                .thenReturn(List.of(b));

        UpdateCourseRequest request = new UpdateCourseRequest();
        ReflectionTestUtils.setField(request, "bakeryIds", List.of(30L));

        courseService.updateManual(3L, request);

        assertThat(course.getCourseBakeries()).hasSize(1);
        assertThat(course.getCourseBakeries().get(0).getBakery().getId()).isEqualTo(30L);
        verify(courseDrivingRouteRepository).deleteAllByCourseIdIn(List.of(3L));
    }

    @Test
    void updateManual_throws_whenDuplicateBakeryIdsProvided() {
        Course course = manualCourse(3L, "수정");
        when(courseRepository.findByIdAndActiveTrue(3L)).thenReturn(Optional.of(course));

        UpdateCourseRequest request = new UpdateCourseRequest();
        ReflectionTestUtils.setField(request, "bakeryIds", List.of(30L, 30L));

        assertThatThrownBy(() -> courseService.updateManual(3L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.INVALID_INPUT_VALUE);
    }

    @Test
    void updateManual_throws_whenBakeryMissing() {
        Course course = manualCourse(3L, "수정");
        when(courseRepository.findByIdAndActiveTrue(3L)).thenReturn(Optional.of(course));
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(30L, 40L), BakeryStatus.APPROVED))
                .thenReturn(List.of(bakery(30L, "있음")));

        UpdateCourseRequest request = new UpdateCourseRequest();
        ReflectionTestUtils.setField(request, "bakeryIds", List.of(30L, 40L));

        assertThatThrownBy(() -> courseService.updateManual(3L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    @Test
    void delete_removes_course_when_found() {
        Course course = manualCourse(4L, "삭제");
        when(courseRepository.findByIdAndActiveTrue(4L)).thenReturn(Optional.of(course));

        courseService.delete(4L);

        assertThat(course.isActive()).isFalse();
    }

    @Test
    void like_throws_whenPrivateAndNotOwner() {
        Course course = aiPrivateCourse(1L, owner(1L));
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.like(1L, 2L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void like_throws_whenAlreadyLiked() {
        Course course = manualCourse(1L, "공유");
        User user = user(3L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(courseLikeRepository)
                .saveAndFlush(any(CourseLike.class));

        assertThatThrownBy(() -> courseService.like(1L, 3L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_COURSE_LIKED);
    }

    @Test
    void like_saves_when_not_yet_liked() {
        Course course = manualCourse(1L, "공유");
        User user = user(3L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        courseService.like(1L, 3L);

        ArgumentCaptor<CourseLike> captor = ArgumentCaptor.forClass(CourseLike.class);
        verify(courseLikeRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getCourse()).isSameAs(course);
        assertThat(captor.getValue().getUser()).isSameAs(user);
    }

    @Test
    void like_maps_duplicate_key_when_concurrent_save() {
        Course course = manualCourse(1L, "공유");
        User user = user(3L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(courseLikeRepository)
                .saveAndFlush(any(CourseLike.class));

        assertThatThrownBy(() -> courseService.like(1L, 3L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_COURSE_LIKED);
    }

    @Test
    void like_throws_when_user_missing() {
        Course course = manualCourse(1L, "shared-course");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(3L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.like(1L, 3L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void unlike_deletes_like_when_like_exists() {
        Course course = manualCourse(1L, "공유");
        CourseLike like = CourseLike.builder().course(course).user(user(2L)).build();
        when(courseLikeRepository.findByCourseIdAndUserId(1L, 2L)).thenReturn(Optional.of(like));

        courseService.unlike(1L, 2L);

        verify(courseLikeRepository).delete(like);
    }

    @Test
    void unlike_throws_when_not_liked() {
        when(courseLikeRepository.findByCourseIdAndUserId(1L, 8L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.unlike(1L, 8L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_COURSE_LIKED);

        verify(courseLikeRepository, never()).delete(any(CourseLike.class));
    }

    @Test
    void findMyRoutes_maps_summaries_when_routes_exist() {
        Course course = manualCourse(10L, "루트");
        Bakery bakery = bakery(5L, "맛집");
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());
        Route route = Route.builder().course(course).user(user(1L)).build();
        when(routeRepository.findActiveByUserId(1L)).thenReturn(List.of(route));

        List<RouteResponse> responses = courseService.findMyRoutes(1L);

        assertThat(responses).hasSize(1);
        assertThat(responses.get(0).getBakeryNames()).containsExactly("맛집");
    }

    @Test
    void saveRoute_throws_whenAlreadySaved() {
        Course course = manualCourse(1L, "공유");
        User user = user(4L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(routeRepository)
                .saveAndFlush(any(Route.class));

        assertThatThrownBy(() -> courseService.saveRoute(1L, 4L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_ROUTED);
    }

    @Test
    void saveRoute_persists_when_first_save() {
        Course course = manualCourse(1L, "공유");
        User user = user(4L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));

        courseService.saveRoute(1L, 4L);

        ArgumentCaptor<Route> captor = ArgumentCaptor.forClass(Route.class);
        verify(routeRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getCourse()).isSameAs(course);
        assertThat(captor.getValue().getUser()).isSameAs(user);
    }

    @Test
    void saveRoute_maps_violation_when_duplicate_route() {
        Course course = manualCourse(1L, "공유");
        User user = user(4L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(routeRepository)
                .saveAndFlush(any(Route.class));

        assertThatThrownBy(() -> courseService.saveRoute(1L, 4L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_ROUTED);
    }

    @Test
    void saveRoute_throws_when_user_missing() {
        Course course = manualCourse(1L, "shared-course");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(userRepository.findById(4L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.saveRoute(1L, 4L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void saveRoute_throws_when_private_course_and_requester_not_owner() {
        Course course = aiPrivateCourse(1L, owner(1L));
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.saveRoute(1L, 2L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void removeRoute_throws_when_not_routed() {
        when(routeRepository.findByCourseIdAndUserId(1L, 2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.removeRoute(1L, 2L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_ROUTED);

        verify(routeRepository, never()).delete(any(Route.class));
    }

    @Test
    void removeRoute_deletes_when_route_exists() {
        Route route = Route.builder().course(manualCourse(1L, "c")).user(user(2L)).build();
        when(routeRepository.findByCourseIdAndUserId(1L, 2L)).thenReturn(Optional.of(route));

        courseService.removeRoute(1L, 2L);

        verify(routeRepository).delete(route);
    }

    @Test
    void updateManual_doesNotInvalidateCache_whenBakeriesNotChanged() {
        Course course = manualCourse(1L, "이름");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        UpdateCourseRequest request = new UpdateCourseRequest();
        ReflectionTestUtils.setField(request, "name", "새이름");

        courseService.updateManual(1L, request);

        verify(courseDrivingRouteRepository, never()).deleteAllByCourseIdIn(any());
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────

    private static void syncCourseBakeriesForDetail(Course course) {
        Bakery bakery = bakery(10L, "빵집");
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());
    }

    private static Course manualCourse(long id, String name) {
        ManualCourseInfo info =
                ManualCourseInfo.builder().editorPick(false).breadType(BreadType.BREAD).build();
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
        Course course = Course.createAi("AI 코스", owner, null, aiInfo, Set.of());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static User owner(long id) {
        User user = user(id);
        return user;
    }

    private static User user(long id) {
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

    private static Bakery bakery(long id, String name) {
        Bakery b =
                Bakery.builder()
                        .name(name)
                        .address("addr")
                        .region("서울")
                        .latitude(0.0)
                        .longitude(0.0)
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

    private static ManualCourseRequest manualRequest(String name, List<Long> bakeryIds) {
        ManualCourseRequest request = new ManualCourseRequest();
        ReflectionTestUtils.setField(request, "name", name);
        ReflectionTestUtils.setField(request, "bakeryIds", bakeryIds);
        return request;
    }
}

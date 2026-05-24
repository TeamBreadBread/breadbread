package com.breadbread.course.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.entity.BreadType;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.client.DrivingRouteClient;
import com.breadbread.course.dto.Coordinate;
import com.breadbread.course.dto.CourseListResponse;
import com.breadbread.course.dto.CourseSearch;
import com.breadbread.course.dto.DrivingRouteResponse;
import com.breadbread.course.dto.ManualCourseRequest;
import com.breadbread.course.dto.ReorderBakeriesRequest;
import com.breadbread.course.dto.ReorderBakeriesResponse;
import com.breadbread.course.dto.RouteResponse;
import com.breadbread.course.dto.RouteResult;
import com.breadbread.course.dto.UpdateCourseRequest;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiJobStatus;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.CourseDrivingRoute;
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
import com.breadbread.course.service.ai.AiCourseAsyncService;
import com.breadbread.course.service.ai.AiCourseRedisService;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
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
    @Mock private BakeryImageRepository bakeryImageRepository;
    @Mock private CourseLikeRepository courseLikeRepository;
    @Mock private UserRepository userRepository;
    @Mock private RouteRepository routeRepository;
    @Mock private CourseDrivingRouteRepository courseDrivingRouteRepository;
    @Mock private AiCourseAsyncService aiCourseAsyncService;
    @Mock private AiCourseRedisService aiCourseRedisService;
    @Mock private DrivingRouteClient drivingRouteClient;
    @Mock private CourseDrivingRouteSaver courseDrivingRouteSaver;

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
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(10L), 1))
                .thenReturn(
                        List.of(
                                BakeryImage.builder()
                                        .imageUrl("thumb.jpg")
                                        .displayOrder(1)
                                        .bakery(bakery)
                                        .build()));
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
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(anyList(), eq(1)))
                .thenReturn(List.of());
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
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(10L), 1))
                .thenReturn(List.of());
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
        when(bakeryImageRepository.findAllByBakeryIdInAndDisplayOrder(List.of(10L), 1))
                .thenReturn(List.of());
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
        when(bakeryRepository.findAllByIdInAndActiveTrue(List.of(1L, 1L)))
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
        when(bakeryRepository.findAllByIdInAndActiveTrue(List.of(1L, 2L)))
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
        when(bakeryRepository.findAllByIdInAndActiveTrue(List.of(10L, 20L)))
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
        when(bakeryRepository.findAllByIdInAndActiveTrue(List.of(30L))).thenReturn(List.of(b));

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
        when(bakeryRepository.findAllByIdInAndActiveTrue(List.of(30L, 40L)))
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
    void createAi_returns_job_id_when_async_submit_ok() {
        AiCourseRequest request = new AiCourseRequest();
        when(aiCourseAsyncService.processAiCourse(anyString(), eq(2L), eq(request)))
                .thenReturn(CompletableFuture.completedFuture(null));

        String jobId = courseService.createAi(2L, request);

        assertThat(jobId).isNotBlank();
        verify(aiCourseRedisService).savePending(eq(jobId), eq(2L));
        verify(aiCourseAsyncService).processAiCourse(eq(jobId), eq(2L), eq(request));
    }

    @Test
    void createAi_throws_whenAsyncSubmitFails() {
        AiCourseRequest request = new AiCourseRequest();
        when(aiCourseAsyncService.processAiCourse(anyString(), eq(2L), eq(request)))
                .thenThrow(new IllegalStateException("submit"));

        assertThatThrownBy(() -> courseService.createAi(2L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_SERVER_ERROR);

        verify(aiCourseRedisService).saveFailed(anyString(), eq("작업 제출에 실패했습니다."));
    }

    @Test
    void getAiJobStatus_throws_whenUnknownJob() {
        when(aiCourseRedisService.findByJobId("job-1", 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getAiJobStatus("job-1", 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_JOB_NOT_FOUND);
    }

    @Test
    void getAiJobStatus_returns_cached_when_job_exists() {
        AiJobStatusResponse expected = new AiJobStatusResponse(AiJobStatus.COMPLETED, 9L, null);
        when(aiCourseRedisService.findByJobId("job-2", 1L)).thenReturn(Optional.of(expected));

        assertThat(courseService.getAiJobStatus("job-2", 1L)).isSameAs(expected);
    }

    @Test
    void deleteAi_throws_whenManualCourse() {
        Course course = manualCourse(1L, "수동");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.deleteAi(1L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_AI_COURSE);
    }

    @Test
    void deleteAi_throws_whenNotOwner() {
        Course course = aiPrivateCourse(2L, owner(1L));
        when(courseRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.deleteAi(2L, 99L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void deleteAi_deletes_whenOwner() {
        Course course = aiPrivateCourse(2L, owner(5L));
        when(courseRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(course));

        courseService.deleteAi(2L, 5L);

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
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseLikeRepository.existsByCourseIdAndUserId(1L, 3L)).thenReturn(true);

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
        when(courseLikeRepository.existsByCourseIdAndUserId(1L, 3L)).thenReturn(false);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));

        courseService.like(1L, 3L);

        ArgumentCaptor<CourseLike> captor = ArgumentCaptor.forClass(CourseLike.class);
        verify(courseLikeRepository).save(captor.capture());
        assertThat(captor.getValue().getCourse()).isSameAs(course);
        assertThat(captor.getValue().getUser()).isSameAs(user);
    }

    @Test
    void like_maps_duplicate_key_when_concurrent_save() {
        Course course = manualCourse(1L, "공유");
        User user = user(3L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseLikeRepository.existsByCourseIdAndUserId(1L, 3L)).thenReturn(false);
        when(userRepository.findById(3L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(courseLikeRepository)
                .save(any(CourseLike.class));

        assertThatThrownBy(() -> courseService.like(1L, 3L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_COURSE_LIKED);
    }

    @Test
    void like_throws_when_user_missing() {
        Course course = manualCourse(1L, "shared-course");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseLikeRepository.existsByCourseIdAndUserId(1L, 3L)).thenReturn(false);
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
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(routeRepository.existsByCourseIdAndUserId(1L, 4L)).thenReturn(true);

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
        when(routeRepository.existsByCourseIdAndUserId(1L, 4L)).thenReturn(false);
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));

        courseService.saveRoute(1L, 4L);

        ArgumentCaptor<Route> captor = ArgumentCaptor.forClass(Route.class);
        verify(routeRepository).save(captor.capture());
        assertThat(captor.getValue().getCourse()).isSameAs(course);
        assertThat(captor.getValue().getUser()).isSameAs(user);
    }

    @Test
    void saveRoute_maps_violation_when_duplicate_route() {
        Course course = manualCourse(1L, "공유");
        User user = user(4L);
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(routeRepository.existsByCourseIdAndUserId(1L, 4L)).thenReturn(false);
        when(userRepository.findById(4L)).thenReturn(Optional.of(user));
        doThrow(new DataIntegrityViolationException("dup"))
                .when(routeRepository)
                .save(any(Route.class));

        assertThatThrownBy(() -> courseService.saveRoute(1L, 4L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ALREADY_ROUTED);
    }

    @Test
    void saveRoute_throws_when_user_missing() {
        Course course = manualCourse(1L, "shared-course");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(routeRepository.existsByCourseIdAndUserId(1L, 4L)).thenReturn(false);
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

    // ── getDrivingRoute ──────────────────────────────────────────────────

    @Test
    void getDrivingRoute_throws_whenCourseNotFound() {
        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getDrivingRoute(1L, 1L, UserRole.ROLE_USER))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    @Test
    void getDrivingRoute_throws_unauthorized_whenPrivateCourseAndAnonymous() {
        Course course = aiPrivateCourse(1L, owner(1L));
        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.getDrivingRoute(1L, null, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.UNAUTHORIZED);
    }

    @Test
    void getDrivingRoute_throws_forbidden_whenPrivateCourseAndNotOwner() {
        Course course = aiPrivateCourse(1L, owner(1L));
        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseService.getDrivingRoute(1L, 2L, UserRole.ROLE_USER))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void getDrivingRoute_allows_admin_to_access_private_course() {
        Course course = aiPrivateCourse(1L, owner(1L));
        List<Coordinate> cachedPath =
                List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1));
        CourseDrivingRoute cached =
                CourseDrivingRoute.builder().courseId(1L).path(cachedPath).build();

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.of(cached));

        DrivingRouteResponse response =
                courseService.getDrivingRoute(1L, 999L, UserRole.ROLE_ADMIN);

        assertThat(response.getPath()).isEqualTo(cachedPath);
        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_returns_cached_path_whenCacheHit() {
        Course course = manualCourse(1L, "공유코스");
        List<Coordinate> cachedPath =
                List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1));
        CourseDrivingRoute cached =
                CourseDrivingRoute.builder().courseId(1L).path(cachedPath).build();

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.of(cached));

        DrivingRouteResponse response = courseService.getDrivingRoute(1L, null, null);

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
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);

        DrivingRouteResponse response = courseService.getDrivingRoute(1L, null, null);

        assertThat(response.getPath()).isEqualTo(path);

        // MANUAL 코스는 사용자 위치 미포함 — 빵집만 좌표로 전달
        ArgumentCaptor<List<Coordinate>> coordCaptor = ArgumentCaptor.forClass(List.class);
        verify(drivingRouteClient).getPath(coordCaptor.capture());
        List<Coordinate> coords = coordCaptor.getValue();
        assertThat(coords).hasSize(2);
        assertThat(coords.get(0).getLat()).isEqualTo(36.0);
        assertThat(coords.get(0).getLng()).isEqualTo(127.0);

        verify(courseDrivingRouteSaver).save(eq(1L), any(RouteResult.class));
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
        when(courseDrivingRouteRepository.findById(2L)).thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);

        courseService.getDrivingRoute(2L, 1L, UserRole.ROLE_USER);

        // AI 코스는 AiCourseInfo의 유저 위치가 첫 번째 좌표로 추가되어야 함
        ArgumentCaptor<List<Coordinate>> coordCaptor = ArgumentCaptor.forClass(List.class);
        verify(drivingRouteClient).getPath(coordCaptor.capture());
        List<Coordinate> coords = coordCaptor.getValue();
        assertThat(coords).hasSize(2); // 유저위치 + 빵집 1개
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
        when(courseDrivingRouteRepository.findById(2L)).thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);

        DrivingRouteResponse response = courseService.getDrivingRoute(2L, 1L, UserRole.ROLE_USER);

        assertThat(response.getPath()).isEqualTo(path);
        verify(drivingRouteClient).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenManualCourseHasOnlyOneBakery() {
        Course course = manualCourse(1L, "공유코스");
        Bakery bakery = bakeryAt(10L, "빵집", 36.0, 127.0);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getDrivingRoute(1L, null, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_INSUFFICIENT_WAYPOINTS);

        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenManualCourseExceedsWaypointLimit() {
        // 수동 코스: 빵집 8개 → coordinates 8개 > 7 (Kakao 최대: origin + 5 waypoints + destination)
        Course course = manualCourse(1L, "공유코스");
        for (int i = 0; i < 8; i++) {
            course.addCourseBakery(
                    CourseBakery.builder()
                            .visitOrder(i + 1)
                            .bakery(bakeryAt(10L + i, "빵집" + i, 36.0 + i * 0.01, 127.0 + i * 0.01))
                            .build());
        }

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getDrivingRoute(1L, null, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_TOO_MANY_WAYPOINTS);

        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenAiCourseExceedsWaypointLimit() {
        // AI 코스: 빵집 7개 + 출발 위치 1개 → coordinates 8개 > 7
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
        when(courseDrivingRouteRepository.findById(2L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getDrivingRoute(2L, 1L, UserRole.ROLE_USER))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_TOO_MANY_WAYPOINTS);

        verify(drivingRouteClient, never()).getPath(any());
    }

    @Test
    void getDrivingRoute_throws_whenBakeryMissingCoordinates() {
        Course course = manualCourse(1L, "공유코스");
        Bakery b1 = bakeryAt(10L, "A빵집", 36.0, 127.0);
        Bakery b2 = nullCoordBakery(20L, "B빵집");
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(b1).build());
        course.addCourseBakery(CourseBakery.builder().visitOrder(2).bakery(b2).build());

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getDrivingRoute(1L, null, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.ROUTE_NOT_FOUND);
    }

    @Test
    void getDrivingRoute_throws_whenAiCourseHasNoAiInfo() {
        User owner = owner(1L);
        Course course = aiPrivateCourse(1L, owner);
        ReflectionTestUtils.setField(course, "aiCourseInfo", null); // aiInfo null 강제
        Bakery bakery = bakeryAt(10L, "빵집", 36.0, 127.0);
        course.addCourseBakery(CourseBakery.builder().visitOrder(1).bakery(bakery).build());

        when(courseRepository.findActiveWithBakeriesById(1L)).thenReturn(Optional.of(course));
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseService.getDrivingRoute(1L, 1L, UserRole.ROLE_USER))
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
        when(courseDrivingRouteRepository.findById(1L)).thenReturn(Optional.empty());
        when(drivingRouteClient.getPath(any())).thenReturn(routeResult);
        doThrow(new DataIntegrityViolationException("dup"))
                .when(courseDrivingRouteSaver)
                .save(eq(1L), any(RouteResult.class));

        // PK 충돌이 나도 경로는 정상 반환
        DrivingRouteResponse response = courseService.getDrivingRoute(1L, null, null);

        assertThat(response.getPath()).isEqualTo(path);
    }

    // ── reorderBakeries ──────────────────────────────────────────────────

    @Test
    void reorderBakeries_throws_whenCourseNotFound() {
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                courseService.reorderBakeries(
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
                                courseService.reorderBakeries(
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
                                courseService.reorderBakeries(
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
                                courseService.reorderBakeries(
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
                                courseService.reorderBakeries(
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
        when(drivingRouteClient.getPath(any())).thenReturn(new RouteResult(path, List.of(), 600));

        // 순서 뒤집기: [20, 10]
        ReorderBakeriesResponse response =
                courseService.reorderBakeries(
                        1L, 99L, UserRole.ROLE_ADMIN, reorderRequest(List.of(20L, 10L)));

        assertThat(response.getCourseId()).isEqualTo(1L);
        assertThat(response.getBakeryOrder()).containsExactly(20L, 10L);
        assertThat(cb2.getVisitOrder()).isEqualTo(1); // 20L → 1순위
        assertThat(cb1.getVisitOrder()).isEqualTo(2); // 10L → 2순위
        verify(courseDrivingRouteRepository).deleteAllByCourseIdIn(List.of(1L));
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
        when(drivingRouteClient.getPath(any()))
                .thenReturn(
                        new RouteResult(
                                List.of(new Coordinate(36.0, 127.0), new Coordinate(36.1, 127.1)),
                                List.of(),
                                600));

        // 비활성 ID 999는 필터링 후 활성 [10, 20]과 일치 → 성공
        ReorderBakeriesResponse response =
                courseService.reorderBakeries(
                        1L, 99L, UserRole.ROLE_ADMIN, reorderRequest(List.of(999L, 10L, 20L)));

        assertThat(response.getBakeryOrder()).containsExactly(10L, 20L);
    }

    // ── updateManual 추가 케이스 ─────────────────────────────────────────

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

    private static Bakery nullCoordBakery(long id, String name) {
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
        ReflectionTestUtils.setField(b, "latitude", null);
        ReflectionTestUtils.setField(b, "longitude", null);
        return b;
    }

    private static ReorderBakeriesRequest reorderRequest(List<Long> bakeryOrder) {
        ReorderBakeriesRequest request = new ReorderBakeriesRequest();
        ReflectionTestUtils.setField(request, "bakeryOrder", bakeryOrder);
        return request;
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
        Course course = Course.createAi("AI 코스", owner, null, aiInfo, Set.of());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }
}

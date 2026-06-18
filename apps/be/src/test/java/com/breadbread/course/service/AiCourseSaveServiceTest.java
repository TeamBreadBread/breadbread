package com.breadbread.course.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryType;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.dto.ai.AiCoursePreviewResponse;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiCourseResultCache;
import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.course.dto.ai.AiJobStatus;
import com.breadbread.course.dto.ai.AiJobStatusResponse;
import com.breadbread.course.dto.ai.RecommendedBakeryResponse;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.ManualCourseInfo;
import com.breadbread.course.entity.TravelType;
import com.breadbread.course.repository.CourseDrivingRouteRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.course.service.ai.AiCourseAsyncService;
import com.breadbread.course.service.ai.AiCourseRedisService;
import com.breadbread.course.service.ai.AiCourseResultRedisService;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.entity.WaitingTolerance;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import java.util.Comparator;
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
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AiCourseSaveServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private BakeryRepository bakeryRepository;
    @Mock private UserRepository userRepository;
    @Mock private UserPreferenceRepository userPreferenceRepository;
    @Mock private AiCourseAsyncService aiCourseAsyncService;
    @Mock private AiCourseRedisService aiCourseRedisService;
    @Mock private AiCourseResultRedisService aiCourseResultRedisService;
    @Mock private CourseDrivingRouteRepository courseDrivingRouteRepository;

    @InjectMocks private AiCourseSaveService aiCourseSaveService;

    @Test
    void createAi_returns_job_id_when_async_submit_ok() {
        AiCourseRequest request = new AiCourseRequest();
        when(userRepository.existsById(2L)).thenReturn(true);
        when(userPreferenceRepository.findByUserId(2L))
                .thenReturn(Optional.of(preference(user(2L))));
        when(aiCourseAsyncService.processAiCourse(anyString(), eq(2L), eq(request)))
                .thenReturn(CompletableFuture.completedFuture(null));

        String jobId = aiCourseSaveService.createAi(2L, request);

        assertThat(jobId).isNotBlank();
        verify(aiCourseRedisService).savePending(eq(jobId), eq(2L));
        verify(aiCourseAsyncService).processAiCourse(eq(jobId), eq(2L), eq(request));
    }

    @Test
    void createAi_throws_whenAsyncSubmitFails() {
        AiCourseRequest request = new AiCourseRequest();
        when(userRepository.existsById(2L)).thenReturn(true);
        when(userPreferenceRepository.findByUserId(2L))
                .thenReturn(Optional.of(preference(user(2L))));
        when(aiCourseAsyncService.processAiCourse(anyString(), eq(2L), eq(request)))
                .thenThrow(new IllegalStateException("submit"));

        assertThatThrownBy(() -> aiCourseSaveService.createAi(2L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_SERVER_ERROR);

        verify(aiCourseRedisService).saveFailed(anyString(), eq("작업 제출에 실패했습니다."));
    }

    @Test
    void getAiJobStatus_throws_whenUnknownJob() {
        when(aiCourseRedisService.findByJobId("job-1", 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> aiCourseSaveService.getAiJobStatus("job-1", 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_JOB_NOT_FOUND);
    }

    @Test
    void getAiJobStatus_returns_cached_when_job_exists() {
        AiJobStatusResponse expected = new AiJobStatusResponse(AiJobStatus.COMPLETED, null);
        when(aiCourseRedisService.findByJobId("job-2", 1L)).thenReturn(Optional.of(expected));

        assertThat(aiCourseSaveService.getAiJobStatus("job-2", 1L)).isSameAs(expected);
    }

    @Test
    void deleteAi_throws_whenManualCourse() {
        Course course = manualCourse(1L, "수동");
        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> aiCourseSaveService.deleteAi(1L, 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NOT_AI_COURSE);
    }

    @Test
    void deleteAi_throws_whenNotOwner() {
        Course course = aiPrivateCourse(2L, owner(1L));
        when(courseRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> aiCourseSaveService.deleteAi(2L, 99L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void deleteAi_deletes_whenOwner() {
        Course course = aiPrivateCourse(2L, owner(5L));
        when(courseRepository.findByIdAndActiveTrue(2L)).thenReturn(Optional.of(course));

        aiCourseSaveService.deleteAi(2L, 5L);

        assertThat(course.isActive()).isFalse();
        verify(courseDrivingRouteRepository).deleteAllByCourseIdIn(List.of(2L));
    }

    @Test
    void getAiPreview_throws_whenResultNotFound() {
        when(aiCourseResultRedisService.getResult("job-p1", 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> aiCourseSaveService.getAiPreview("job-p1", 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_RESULT_NOT_FOUND);
    }

    @Test
    void getAiPreview_throws_whenRecommendedBakeryMissing() {
        AiCourseResultCache cache = resultCache(1L, 10L);
        when(aiCourseResultRedisService.getResult("job-p2", 1L)).thenReturn(Optional.of(cache));
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        anyList(), eq(BakeryStatus.APPROVED)))
                .thenReturn(List.of());

        assertThatThrownBy(() -> aiCourseSaveService.getAiPreview("job-p2", 1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_RECOMMENDED_BAKERY_NOT_FOUND);
    }

    @Test
    void getAiPreview_returns_enriched_preview() {
        Bakery bakery = bakery(10L, "맛집");
        AiCourseResultCache cache = resultCache(1L, 10L);
        when(aiCourseResultRedisService.getResult("job-p3", 1L)).thenReturn(Optional.of(cache));
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        anyList(), eq(BakeryStatus.APPROVED)))
                .thenReturn(List.of(bakery));

        AiCoursePreviewResponse preview = aiCourseSaveService.getAiPreview("job-p3", 1L);

        assertThat(preview.getName()).isEqualTo("ai-course-name");
        assertThat(preview.getBakeryCount()).isEqualTo(1);
        assertThat(preview.getBakeries()).hasSize(1);

        var b = preview.getBakeries().get(0);
        assertThat(b.getId()).isEqualTo(10L);
        assertThat(b.getName()).isEqualTo("맛집");
        assertThat(b.getAddress()).isEqualTo("addr");
        assertThat(b.getRating()).isEqualTo(4.0);
    }

    @Test
    void saveAiCourse_throws_whenLockAlreadyHeld() {
        when(aiCourseResultRedisService.tryAcquireSaveLock("job-s1")).thenReturn(false);

        assertThatThrownBy(() -> aiCourseSaveService.saveAiCourse("job-s1", 1L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_COURSE_SAVE_IN_PROGRESS);
    }

    @Test
    void saveAiCourse_throws_whenResultNotFound() {
        when(aiCourseResultRedisService.tryAcquireSaveLock("job-s2")).thenReturn(true);
        when(aiCourseResultRedisService.getResult("job-s2", 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> aiCourseSaveService.saveAiCourse("job-s2", 1L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_RESULT_NOT_FOUND);
    }

    @Test
    void saveAiCourse_throws_whenRequesterIsNotOwner() {
        when(aiCourseResultRedisService.tryAcquireSaveLock("job-s3")).thenReturn(true);
        when(aiCourseResultRedisService.getResult("job-s3", 99L))
                .thenThrow(new CustomException(ErrorCode.FORBIDDEN));

        assertThatThrownBy(() -> aiCourseSaveService.saveAiCourse("job-s3", 99L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void saveAiCourse_throws_whenRecommendedBakeryMissing() {
        AiCourseResultCache cache = resultCache(1L, 10L);
        when(aiCourseResultRedisService.tryAcquireSaveLock("job-s4")).thenReturn(true);
        when(aiCourseResultRedisService.getResult("job-s4", 1L)).thenReturn(Optional.of(cache));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userPreferenceRepository.findByUserId(1L))
                .thenReturn(Optional.of(preference(user(1L))));
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        anyList(), eq(BakeryStatus.APPROVED)))
                .thenReturn(List.of());

        assertThatThrownBy(() -> aiCourseSaveService.saveAiCourse("job-s4", 1L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.AI_RECOMMENDED_BAKERY_NOT_FOUND);

        verify(aiCourseResultRedisService, never()).deleteResult(any());
    }

    @Test
    void saveAiCourse_saves_and_returns_courseId() {
        Bakery bakery = bakery(10L, "맛집");
        AiCourseResultCache cache = resultCache(1L, 10L);

        when(aiCourseResultRedisService.tryAcquireSaveLock("job-s5")).thenReturn(true);
        when(aiCourseResultRedisService.getResult("job-s5", 1L)).thenReturn(Optional.of(cache));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userPreferenceRepository.findByUserId(1L))
                .thenReturn(Optional.of(preference(user(1L))));
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        anyList(), eq(BakeryStatus.APPROVED)))
                .thenReturn(List.of(bakery));
        when(courseRepository.save(any(Course.class)))
                .thenAnswer(
                        inv -> {
                            Course c = inv.getArgument(0);
                            ReflectionTestUtils.setField(c, "id", 99L);
                            return c;
                        });

        Long courseId = aiCourseSaveService.saveAiCourse("job-s5", 1L, null);

        assertThat(courseId).isEqualTo(99L);
        verify(courseRepository).save(any(Course.class));
        // 단위 테스트는 트랜잭션 동기화 비활성 → afterCommit 없이 즉시 정리됨
        verify(aiCourseResultRedisService).deleteResult("job-s5");
        verify(aiCourseResultRedisService).releaseSaveLock("job-s5");
        verify(aiCourseRedisService).deleteJob("job-s5");
    }

    @Test
    void saveAiCourse_applies_custom_bakeryOrder_whenProvided() {
        // bakery 10→1번, 20→2번 추천 — 사용자가 [20, 10]으로 역순 지정
        Bakery b10 = bakery(10L, "빵집10");
        Bakery b20 = bakery(20L, "빵집20");
        AiCourseResultCache cache = resultCache2(1L, 10L, 20L);

        when(aiCourseResultRedisService.tryAcquireSaveLock("job-s6")).thenReturn(true);
        when(aiCourseResultRedisService.getResult("job-s6", 1L)).thenReturn(Optional.of(cache));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userPreferenceRepository.findByUserId(1L))
                .thenReturn(Optional.of(preference(user(1L))));
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        anyList(), eq(BakeryStatus.APPROVED)))
                .thenReturn(List.of(b10, b20));

        ArgumentCaptor<Course> captor = ArgumentCaptor.forClass(Course.class);
        when(courseRepository.save(captor.capture()))
                .thenAnswer(
                        inv -> {
                            Course c = inv.getArgument(0);
                            ReflectionTestUtils.setField(c, "id", 100L);
                            return c;
                        });

        Long courseId = aiCourseSaveService.saveAiCourse("job-s6", 1L, List.of(20L, 10L));

        assertThat(courseId).isEqualTo(100L);
        List<CourseBakery> cbs =
                captor.getValue().getCourseBakeries().stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .toList();
        assertThat(cbs.get(0).getBakery().getId()).isEqualTo(20L); // visitOrder=1
        assertThat(cbs.get(1).getBakery().getId()).isEqualTo(10L); // visitOrder=2
    }

    @Test
    void saveAiCourse_throws_whenBakeryOrderMismatch() {
        AiCourseResultCache cache = resultCache2(1L, 10L, 20L);

        when(aiCourseResultRedisService.tryAcquireSaveLock("job-s7")).thenReturn(true);
        when(aiCourseResultRedisService.getResult("job-s7", 1L)).thenReturn(Optional.of(cache));
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userPreferenceRepository.findByUserId(1L))
                .thenReturn(Optional.of(preference(user(1L))));
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        anyList(), eq(BakeryStatus.APPROVED)))
                .thenReturn(List.of(bakery(10L, "빵집10"), bakery(20L, "빵집20")));

        assertThatThrownBy(() -> aiCourseSaveService.saveAiCourse("job-s7", 1L, List.of(10L, 99L)))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_ORDER_COUNT_MISMATCH);
    }

    // ── 헬퍼 ─────────────────────────────────────────────────────────────

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
        Course course = Course.createAi("AI 코스", owner, preference(owner), aiInfo, Set.of());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static User owner(long id) {
        return user(id);
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

    private static AiCourseRequest aiRequest() {
        AiCourseRequest req = new AiCourseRequest();
        ReflectionTestUtils.setField(req, "travelType", TravelType.ALONE);
        ReflectionTestUtils.setField(req, "budgetRange", BudgetRange.ANY);
        ReflectionTestUtils.setField(req, "minimizeRoute", false);
        ReflectionTestUtils.setField(req, "breadTypes", List.of(BreadType.BREAD));
        ReflectionTestUtils.setField(req, "latitude", 36.0);
        ReflectionTestUtils.setField(req, "longitude", 127.0);
        ReflectionTestUtils.setField(req, "waitingPreference", false);
        ReflectionTestUtils.setField(req, "drinkPreference", false);
        ReflectionTestUtils.setField(req, "bakeryCount", 2);
        ReflectionTestUtils.setField(req, "flexibilityLevel", FlexibilityLevel.ACTIVE);
        return req;
    }

    private static AiCourseWebhookResponse webhookResponse(long bakeryId) {
        RecommendedBakeryResponse rb = new RecommendedBakeryResponse();
        ReflectionTestUtils.setField(rb, "id", bakeryId);
        ReflectionTestUtils.setField(rb, "order", 1);
        ReflectionTestUtils.setField(rb, "recommendedBread", "소금빵");
        ReflectionTestUtils.setField(rb, "reason", "맛있음");

        AiCourseWebhookResponse res = new AiCourseWebhookResponse();
        ReflectionTestUtils.setField(res, "name", "ai-course-name");
        ReflectionTestUtils.setField(res, "theme", "테마");
        ReflectionTestUtils.setField(res, "estimatedCost", 8000L);
        ReflectionTestUtils.setField(res, "estimatedTime", "2h");
        ReflectionTestUtils.setField(res, "summary", "요약");
        ReflectionTestUtils.setField(res, "recommendReason", "추천");
        ReflectionTestUtils.setField(res, "bakeries", List.of(rb));
        return res;
    }

    private static AiCourseResultCache resultCache(long userId, long bakeryId) {
        return AiCourseResultCache.builder()
                .userId(userId)
                .request(aiRequest())
                .response(webhookResponse(bakeryId))
                .build();
    }

    private static AiCourseResultCache resultCache2(long userId, long bakeryId1, long bakeryId2) {
        RecommendedBakeryResponse rb1 = new RecommendedBakeryResponse();
        ReflectionTestUtils.setField(rb1, "id", bakeryId1);
        ReflectionTestUtils.setField(rb1, "order", 1);
        ReflectionTestUtils.setField(rb1, "recommendedBread", "크루아상");
        ReflectionTestUtils.setField(rb1, "reason", "이유1");

        RecommendedBakeryResponse rb2 = new RecommendedBakeryResponse();
        ReflectionTestUtils.setField(rb2, "id", bakeryId2);
        ReflectionTestUtils.setField(rb2, "order", 2);
        ReflectionTestUtils.setField(rb2, "recommendedBread", "소금빵");
        ReflectionTestUtils.setField(rb2, "reason", "이유2");

        AiCourseWebhookResponse res = new AiCourseWebhookResponse();
        ReflectionTestUtils.setField(res, "name", "ai-course-name");
        ReflectionTestUtils.setField(res, "theme", "테마");
        ReflectionTestUtils.setField(res, "estimatedCost", 15000L);
        ReflectionTestUtils.setField(res, "estimatedTime", "2h");
        ReflectionTestUtils.setField(res, "summary", "요약");
        ReflectionTestUtils.setField(res, "recommendReason", "추천");
        ReflectionTestUtils.setField(res, "bakeries", List.of(rb1, rb2));

        return AiCourseResultCache.builder()
                .userId(userId)
                .request(aiRequest())
                .response(res)
                .build();
    }

    private static UserPreference preference(User user) {
        return UserPreference.builder()
                .bakeryTypes(List.of(BakeryType.CLASSIC))
                .bakeryPersonalities(List.of())
                .bakeryUseTypes(List.of())
                .waitingTolerance(WaitingTolerance.NO_WAIT)
                .user(user)
                .build();
    }
}

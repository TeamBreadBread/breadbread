package com.breadbread.course.service.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryType;
import com.breadbread.bakery.entity.BreadType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.bakery.repository.CrowdTimeRepository;
import com.breadbread.course.client.AiWebhookClient;
import com.breadbread.course.dto.ai.AiCourseRequest;
import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.course.dto.ai.RecommendedBakeryResponse;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.TravelType;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.entity.WaitingTolerance;
import com.breadbread.user.repository.UserPreferenceRepository;
import com.breadbread.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("unchecked")
class AiCourseAsyncServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private UserPreferenceRepository userPreferenceRepository;
    @Mock private BakeryRepository bakeryRepository;
    @Mock private BreadRepository breadRepository;
    @Mock private CrowdTimeRepository crowdTimeRepository;
    @Mock private AiWebhookClient aiWebhookClient;
    @Mock private CourseRepository courseRepository;
    @Mock private AiCourseRedisService aiCourseRedisService;
    @Mock private TransactionTemplate transactionTemplate;

    private AiCourseAsyncService aiCourseAsyncService;

    @BeforeEach
    void setUp() {
        when(transactionTemplate.execute(any(TransactionCallback.class)))
                .thenAnswer(
                        inv -> {
                            TransactionCallback<?> cb = inv.getArgument(0);
                            return cb.doInTransaction(new SimpleTransactionStatus());
                        });
        aiCourseAsyncService =
                new AiCourseAsyncService(
                        userRepository,
                        userPreferenceRepository,
                        bakeryRepository,
                        breadRepository,
                        crowdTimeRepository,
                        aiWebhookClient,
                        courseRepository,
                        aiCourseRedisService,
                        transactionTemplate);
    }

    @Test
    void processAiCourse_saveFailed_whenUserNotFound() {
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        aiCourseAsyncService.processAiCourse("job-a", 1L, aiRequest()).join();

        verify(aiCourseRedisService).saveFailed(eq("job-a"), any());
    }

    @Test
    void processAiCourse_saveFailed_whenPreferenceMissing() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userPreferenceRepository.findByUserId(1L)).thenReturn(Optional.empty());

        aiCourseAsyncService.processAiCourse("job-b", 1L, aiRequest()).join();

        verify(aiCourseRedisService).saveFailed(eq("job-b"), any());
    }

    @Test
    void processAiCourse_saveFailed_whenWebhookResponseInvalid() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userPreferenceRepository.findByUserId(1L))
                .thenReturn(Optional.of(preference(user(1L))));
        when(bakeryRepository.findAll()).thenReturn(List.of());
        when(breadRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());
        when(aiWebhookClient.requestCourse(eq("job-c"), any())).thenReturn(null);

        aiCourseAsyncService.processAiCourse("job-c", 1L, aiRequest()).join();

        verify(aiCourseRedisService).saveFailed(eq("job-c"), eq("AI 응답 데이터가 올바르지 않습니다."));
    }

    @Test
    void processAiCourse_saveFailed_whenWebhookThrows() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user(1L)));
        when(userPreferenceRepository.findByUserId(1L))
                .thenReturn(Optional.of(preference(user(1L))));
        when(bakeryRepository.findAll()).thenReturn(List.of());
        when(breadRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of())).thenReturn(List.of());
        when(aiWebhookClient.requestCourse(eq("job-throw"), any()))
                .thenThrow(new IllegalStateException("portone down"));

        aiCourseAsyncService.processAiCourse("job-throw", 1L, aiRequest()).join();

        verify(aiCourseRedisService).saveFailed(eq("job-throw"), eq("AI 서버 오류가 발생했습니다."));
    }

    @Test
    void processAiCourse_saveCompleted_whenWebhookSucceeds() {
        User user = user(1L);
        UserPreference pref = preference(user);
        Bakery bakery = bakery(10L, "맛집");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(pref));
        when(bakeryRepository.findAll()).thenReturn(List.of(bakery));
        when(breadRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of());

        AiCourseWebhookResponse webhookResponse = validWebhookResponse(10L);
        when(aiWebhookClient.requestCourse(eq("job-d"), any())).thenReturn(webhookResponse);
        when(bakeryRepository.findAllById(List.of(10L))).thenReturn(List.of(bakery));
        when(courseRepository.save(any(Course.class)))
                .thenAnswer(
                        inv -> {
                            Course c = inv.getArgument(0);
                            ReflectionTestUtils.setField(c, "id", 777L);
                            return c;
                        });

        aiCourseAsyncService.processAiCourse("job-d", 1L, aiRequest()).join();

        verify(aiCourseRedisService).saveCompleted("job-d", 777L);
        ArgumentCaptor<Course> courseCaptor = ArgumentCaptor.forClass(Course.class);
        verify(courseRepository).save(courseCaptor.capture());
        assertThat(courseCaptor.getValue().getName()).isEqualTo("ai-course-name");
    }

    @Test
    void processAiCourse_saveFailed_whenRecommendedBakeryMissingInDb() {
        User user = user(1L);
        UserPreference pref = preference(user);
        Bakery bakery = bakery(10L, "맛집");

        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(userPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(pref));
        when(bakeryRepository.findAll()).thenReturn(List.of(bakery));
        when(breadRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of());
        when(crowdTimeRepository.findAllByBakeryIdIn(List.of(10L))).thenReturn(List.of());

        AiCourseWebhookResponse webhookResponse = validWebhookResponse(99L);
        when(aiWebhookClient.requestCourse(eq("job-e"), any())).thenReturn(webhookResponse);
        when(bakeryRepository.findAllById(List.of(99L))).thenReturn(List.of());

        aiCourseAsyncService.processAiCourse("job-e", 1L, aiRequest()).join();

        verify(aiCourseRedisService)
                .saveFailed(eq("job-e"), eq(ErrorCode.AI_SERVER_ERROR.getMessage()));
    }

    private static AiCourseWebhookResponse validWebhookResponse(long bakeryId) {
        RecommendedBakeryResponse rb = new RecommendedBakeryResponse();
        ReflectionTestUtils.setField(rb, "id", bakeryId);
        ReflectionTestUtils.setField(rb, "order", 1);
        ReflectionTestUtils.setField(rb, "recommendedBread", "소금빵");
        ReflectionTestUtils.setField(rb, "reason", "맛있음");

        AiCourseWebhookResponse response = new AiCourseWebhookResponse();
        ReflectionTestUtils.setField(response, "name", "ai-course-name");
        ReflectionTestUtils.setField(response, "theme", "테마");
        ReflectionTestUtils.setField(response, "estimatedCost", 8000L);
        ReflectionTestUtils.setField(response, "estimatedTime", "2h");
        ReflectionTestUtils.setField(response, "summary", "요약");
        ReflectionTestUtils.setField(response, "recommendReason", "추천");
        ReflectionTestUtils.setField(response, "bakeries", List.of(rb));
        return response;
    }

    private static AiCourseRequest aiRequest() {
        AiCourseRequest request = new AiCourseRequest();
        ReflectionTestUtils.setField(request, "travelType", TravelType.ALONE);
        ReflectionTestUtils.setField(request, "budgetRange", BudgetRange.ANY);
        ReflectionTestUtils.setField(request, "minimizeRoute", false);
        ReflectionTestUtils.setField(request, "breadTypes", List.of(BreadType.BREAD));
        ReflectionTestUtils.setField(request, "latitude", 36.0);
        ReflectionTestUtils.setField(request, "longitude", 127.0);
        ReflectionTestUtils.setField(request, "waitingPreference", false);
        ReflectionTestUtils.setField(request, "drinkPreference", false);
        ReflectionTestUtils.setField(request, "bakeryCount", 2);
        ReflectionTestUtils.setField(request, "flexibilityLevel", FlexibilityLevel.ACTIVE);
        return request;
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

    private static User user(long id) {
        User user =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("이름")
                        .nickname("nick")
                        .email("e@t.com")
                        .phone("01012345678")
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private static Bakery bakery(long id, String name) {
        Bakery b =
                Bakery.builder()
                        .name(name)
                        .address("addr")
                        .region("대전")
                        .latitude(36.0)
                        .longitude(127.0)
                        .phone("010")
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

package com.breadbread.course.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.entity.AiCourseInfo;
import com.breadbread.course.entity.BudgetRange;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.FlexibilityLevel;
import com.breadbread.course.entity.TravelType;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CourseBakeryMutationServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CourseBakeryRepository courseBakeryRepository;
    @Mock private BakeryRepository bakeryRepository;
    @Mock private CourseDrivingRouteService courseDrivingRouteService;

    @InjectMocks private CourseBakeryMutationService service;

    @Test
    void excludeBakery_doesNotCallFetchAndSaveRoute() {
        User owner = owner(1L);
        Course course = aiCourse(1L, owner);

        Bakery bakeryA = bakery(10L, "A");
        Bakery bakeryB = bakery(20L, "B");
        CourseBakery cbA =
                CourseBakery.builder().visitOrder(1).course(course).bakery(bakeryA).build();
        CourseBakery cbB =
                CourseBakery.builder().visitOrder(2).course(course).bakery(bakeryB).build();
        course.getCourseBakeries().add(cbA);
        course.getCourseBakeries().add(cbB);

        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L))
                .thenReturn(List.of(cbA, cbB))
                .thenReturn(List.of(cbB));

        service.excludeBakery(1L, 1L, UserRole.ROLE_USER, 10L);

        verify(courseDrivingRouteService).invalidateCache(1L);
        verify(courseDrivingRouteService, never())
                .fetchAndSaveRoute(any(), any(), any(), anyInt(), any());
    }

    @Test
    void replaceBakery_autoSuggest_throwsNoReplacementBakeryFound_whenNoCandidates() {
        User owner = owner(1L);
        Course course = aiCourse(1L, owner);

        Bakery target = bakery(10L, "Target");
        CourseBakery cb =
                CourseBakery.builder().visitOrder(1).course(course).bakery(target).build();
        course.getCourseBakeries().add(cb);

        when(courseRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseId(1L)).thenReturn(List.of(cb));
        when(bakeryRepository.search(any(), any())).thenReturn(new PageImpl<>(List.of()));

        assertThatThrownBy(() -> service.replaceBakery(1L, 1L, UserRole.ROLE_USER, 10L, null))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.NO_REPLACEMENT_BAKERY_FOUND);
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

    private static Course aiCourse(long id, User user) {
        AiCourseInfo aiInfo =
                AiCourseInfo.builder()
                        .travelType(TravelType.ALONE)
                        .budgetRange(BudgetRange.ANY)
                        .flexibilityLevel(FlexibilityLevel.MAINTAIN)
                        .latitude(37.5)
                        .longitude(127.0)
                        .bakeryCount(2)
                        .build();
        com.breadbread.user.entity.UserPreference pref =
                com.breadbread.user.entity.UserPreference.builder().bakeryTypes(List.of()).build();
        Course course = Course.createAi("AI코스", user, pref, aiInfo, Set.of());
        ReflectionTestUtils.setField(course, "id", id);
        return course;
    }

    private static Bakery bakery(long id, String name) {
        Bakery b =
                Bakery.builder()
                        .name(name)
                        .address("addr")
                        .region("서울")
                        .latitude(37.5)
                        .longitude(127.0)
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

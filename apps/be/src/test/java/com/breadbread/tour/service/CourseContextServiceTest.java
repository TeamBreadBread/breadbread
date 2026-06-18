package com.breadbread.tour.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.breadbread.course.entity.Course;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.CourseInfo;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.entity.WaitingTolerance;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CourseContextServiceTest {

    @Mock private CourseRepository courseRepository;
    @Mock private CourseBakeryRepository courseBakeryRepository;

    @InjectMocks private CourseContextService courseContextService;

    // ── 공개 코스 ──────────────────────────────────────────────────────────────

    @Test
    void 공개_코스_누구나_접근_성공() {
        Course course = Course.createManual("빵 투어", null, null, null, null, null, null);
        ReflectionTestUtils.setField(course, "id", 100L);
        when(courseRepository.findByIdAndActiveTrue(100L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseIdWithBakery(100L)).thenReturn(List.of());

        CourseInfo result = courseContextService.loadWithAccessCheck(99L, 100L);

        assertThat(result).isNotNull();
        assertThat(result.getCourseId()).isEqualTo(100L);
    }

    // ── 비공개 코스 ────────────────────────────────────────────────────────────

    @Test
    void 비공개_코스_본인_접근_성공() {
        User owner = user(1L);
        Course course = Course.createAi("AI 코스", owner, emptyPreference(owner), null, Set.of());
        ReflectionTestUtils.setField(course, "id", 200L);
        when(courseRepository.findByIdAndActiveTrue(200L)).thenReturn(Optional.of(course));
        when(courseBakeryRepository.findAllByCourseIdWithBakery(200L)).thenReturn(List.of());

        CourseInfo result = courseContextService.loadWithAccessCheck(1L, 200L);

        assertThat(result).isNotNull();
        assertThat(result.getCourseId()).isEqualTo(200L);
    }

    @Test
    void 비공개_코스_타인_접근_FORBIDDEN() {
        User owner = user(1L);
        Course course = Course.createAi("AI 코스", owner, emptyPreference(owner), null, Set.of());
        ReflectionTestUtils.setField(course, "id", 200L);
        when(courseRepository.findByIdAndActiveTrue(200L)).thenReturn(Optional.of(course));

        assertThatThrownBy(() -> courseContextService.loadWithAccessCheck(99L, 200L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    // ── 비활성 코스 ────────────────────────────────────────────────────────────

    @Test
    void 비활성_코스_COURSE_NOT_FOUND() {
        when(courseRepository.findByIdAndActiveTrue(999L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> courseContextService.loadWithAccessCheck(1L, 999L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.COURSE_NOT_FOUND);
    }

    // ── helpers ────────────────────────────────────────────────────────────────

    private UserPreference emptyPreference(User user) {
        return UserPreference.builder()
                .bakeryTypes(List.of())
                .bakeryPersonalities(List.of())
                .bakeryUseTypes(List.of())
                .waitingTolerance(WaitingTolerance.NO_WAIT)
                .user(user)
                .build();
    }

    private User user(long id) {
        User u =
                User.builder()
                        .loginId("user" + id)
                        .name("사용자" + id)
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }
}

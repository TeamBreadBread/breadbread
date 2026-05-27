package com.breadbread.tour.service;

import com.breadbread.course.entity.Course;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.tour.dto.CongestionAlertWebhookRequest.CourseInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 웹훅 호출 전 DB 트랜잭션 범위를 분리하기 위한 서비스 (Spring AOP 내부 호출 제약 회피). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CourseContextService {

    private final CourseRepository courseRepository;
    private final CourseBakeryRepository courseBakeryRepository;

    public CourseInfo loadWithAccessCheck(Long userId, Long courseId) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        if (!course.isShared()
                && (course.getUser() == null || !course.getUser().getId().equals(userId))) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }

        return CourseInfo.from(
                course, courseBakeryRepository.findAllByCourseIdWithBakery(courseId));
    }
}

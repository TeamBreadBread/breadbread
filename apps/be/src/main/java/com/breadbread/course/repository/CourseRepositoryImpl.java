package com.breadbread.course.repository;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.course.dto.CourseSearch;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.QCourse;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
public class CourseRepositoryImpl implements CourseRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Course> search(CourseSearch search, Pageable pageable) {
        QCourse course = QCourse.course;

        BooleanExpression condition =
                course.shared
                        .isTrue()
                        .and(eqRegion(course, search.getRegion()))
                        .and(eqBreadType(course, search.getBreadType()))
                        .and(eqTheme(course, search.getTheme()))
                        .and(eqEditorPick(course, search.getEditorPick()));

        List<Course> content =
                queryFactory
                        .selectFrom(course)
                        .where(condition)
                        .orderBy(course.id.desc())
                        .offset(pageable.getOffset())
                        .limit(pageable.getPageSize())
                        .fetch();

        Long total = queryFactory.select(course.count()).from(course).where(condition).fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    private BooleanExpression eqRegion(QCourse course, String region) {
        return StringUtils.hasText(region) ? course.region.eq(region) : null;
    }

    private BooleanExpression eqBreadType(QCourse course, BreadType breadType) {
        return breadType != null ? course.manualCourseInfo.breadType.eq(breadType) : null;
    }

    private BooleanExpression eqTheme(QCourse course, String theme) {
        return StringUtils.hasText(theme) ? course.theme.eq(theme) : null;
    }

    private BooleanExpression eqEditorPick(QCourse course, Boolean editorPick) {
        return editorPick != null ? course.manualCourseInfo.editorPick.eq(editorPick) : null;
    }
}

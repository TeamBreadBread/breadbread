package com.breadbread.course.repository;

import com.breadbread.course.dto.CourseSearch;
import com.breadbread.course.entity.Course;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CourseRepositoryCustom {
    Page<Course> search(CourseSearch courseSearch, Pageable pageable);
}

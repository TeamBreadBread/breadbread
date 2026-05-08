package com.breadbread.course.entity;

import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "route",
        uniqueConstraints = {@UniqueConstraint(columnNames = {"course_id", "user_id"})})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Builder
    public Route(Course course, User user) {
        this.course = course;
        this.user = user;
    }
}

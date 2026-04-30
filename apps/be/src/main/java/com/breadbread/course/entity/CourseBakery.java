package com.breadbread.course.entity;

import com.breadbread.bakery.entity.Bakery;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "course_bakery")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = {"course", "bakery"})
public class CourseBakery {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int visitOrder;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    private String reason;  // AI가 이 빵집을 추천한 이유 (AI코스만 사용)

    @Builder
    public CourseBakery(int visitOrder, Course course, Bakery bakery, String reason) {
        this.visitOrder = visitOrder;
        this.course = course;
        this.bakery = bakery;
        this.reason = reason;
    }

    void setCourse(Course course) {
        this.course = course;
    }
}

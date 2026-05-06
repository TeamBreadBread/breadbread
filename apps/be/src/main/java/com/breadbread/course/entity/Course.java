package com.breadbread.course.entity;

import com.breadbread.bakery.entity.BreadType;
import com.breadbread.global.entity.BaseEntity;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserPreference;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "course")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Course extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CourseType courseType;

	private String region;

	private String theme;

	private String summary;

    private String thumbnailUrl;

    private Integer estimatedCost;

    private String estimatedTime;

    private boolean shared;  // AI코스 공유 여부 (MANUAL은 항상 true)

    @Embedded
    private AiCourseInfo aiCourseInfo;

    @Embedded
    private ManualCourseInfo manualCourseInfo;

    @OneToMany(mappedBy = "course", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<CourseBakery> courseBakeries = new ArrayList<>();

    @OneToMany(mappedBy = "course", fetch = FetchType.LAZY)
    private List<CourseLike> courseLikes = new ArrayList<>();

    // AI코스 칼럼
    @ElementCollection
    @CollectionTable(name = "course_preferred_bread_types", joinColumns = @JoinColumn(name = "course_id"))
    @Enumerated(EnumType.STRING)
    private Set<BreadType> preferredBreadTypes = new HashSet<>();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_preference_id")
    private UserPreference userPreference;

    // 정적 팩토리
    public static Course createManual(String name, String thumbnailUrl,
                                      String estimatedTime, Integer estimatedCost,
									  String theme, String region,
                                      ManualCourseInfo manualCourseInfo) {
        Course course = new Course();
        course.name = name;
        course.courseType = CourseType.MANUAL;
        course.thumbnailUrl = thumbnailUrl;
        course.estimatedTime = estimatedTime;
        course.estimatedCost = estimatedCost;
		course.theme = theme;
		course.region = region;
        course.manualCourseInfo = manualCourseInfo;
        course.shared = true;
        return course;
    }

    public static Course createAi(String name, User user, UserPreference userPreference,
                                   AiCourseInfo aiCourseInfo, Set<BreadType> preferredBreadTypes) {
        Course course = new Course();
        course.name = name;
        course.courseType = CourseType.AI;
        course.user = user;
        course.userPreference = userPreference;
        course.aiCourseInfo = aiCourseInfo;
        course.preferredBreadTypes = preferredBreadTypes;
        course.shared = false;
        return course;
    }

    public void addCourseBakery(CourseBakery courseBakery) {
        this.courseBakeries.add(courseBakery);
        courseBakery.setCourse(this);
    }

    public void updateManual(String name, String thumbnailUrl,
                             String estimatedTime, Integer estimatedCost,
							 String theme, String region,
                             ManualCourseInfo manualCourseInfo) {
        validateManual();
        if (name != null) this.name = name;
        if (thumbnailUrl != null) this.thumbnailUrl = thumbnailUrl;
        if (estimatedTime != null) this.estimatedTime = estimatedTime;
        if (estimatedCost != null) this.estimatedCost = estimatedCost;
		if (theme != null) this.theme = theme;
		if (region != null) this.region = region;
        if (manualCourseInfo != null) this.manualCourseInfo = manualCourseInfo;
    }

    public void clearCourseBakeries() {
        this.courseBakeries.clear();
    }

    public void updateAiResult(Integer estimatedCost,String estimatedTime,
							   String theme, String summary) {
        this.estimatedCost = estimatedCost;
        this.estimatedTime = estimatedTime;
		this.theme = theme;
		this.summary = summary;
    }

    public void share() {
        validateAi();
        this.shared = true;
    }

    public void unshare() {
        validateAi();
        this.shared = false;
    }

    private void validateAi() {
        if (this.courseType != CourseType.AI) {
            throw new CustomException(ErrorCode.NOT_AI_COURSE);
        }
    }

    private void validateManual() {
        if (this.courseType != CourseType.MANUAL) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }
    }
}

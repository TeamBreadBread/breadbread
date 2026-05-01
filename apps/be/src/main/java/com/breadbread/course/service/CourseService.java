package com.breadbread.course.service;

import com.breadbread.bakery.dto.BakerySummaryResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import com.breadbread.bakery.repository.BakeryImageRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.dto.*;
import com.breadbread.course.entity.*;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepository;
    private final BakeryRepository bakeryRepository;
	private final CourseBakeryRepository courseBakeryRepository;
	private final BakeryImageRepository bakeryImageRepository;

	@Transactional(readOnly = true)
	public CourseListResponse search(CourseSearch courseSearch, Pageable pageable){
		Page<Course> courses = courseRepository.search(courseSearch, pageable);

		List<CourseSummaryResponse> summaries = courses.stream()
			.map(course -> {
				List<CourseBakerySummary> bakeries = course.getCourseBakeries().stream()
					.sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
					.map(cb -> CourseBakerySummary.from(cb.getBakery()))
					.toList();
				return CourseSummaryResponse.from(course, bakeries);
		}).toList();
		return CourseListResponse.builder()
			.courses(summaries)
			.total((int) courses.getTotalElements())
			.page(pageable.getPageNumber())
			.size(pageable.getPageSize())
			.hasNext(courses.hasNext())
			.build();
	}

	@Transactional(readOnly = true)
	public CourseDetailResponse findOne(Long id, Long userId, boolean isAdmin){
		Course course = courseRepository.findById(id)
			.orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

		if (!course.isShared() && !isAdmin) {
			if (userId == null) {
				throw new CustomException(ErrorCode.UNAUTHORIZED);
			}
			if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
				throw new CustomException(ErrorCode.FORBIDDEN);
			}
		}
		List<CourseBakery> courseBakeries = courseBakeryRepository.findAllByCourseIdOrderByVisitOrder(id);

		List<Long> bakeryIds = courseBakeries.stream()
			.map(cb -> cb.getBakery().getId())
			.toList();

		Map<Long, String> thumbnailMap = bakeryImageRepository
			.findAllByBakeryIdInAndDisplayOrder(bakeryIds, 1)
			.stream()
			.collect(Collectors.toMap(img -> img.getBakery().getId(), BakeryImage::getImageUrl));

		List<BakerySummaryResponse> bakeries = courseBakeries.stream()
			.map(cb -> BakerySummaryResponse.from(
				cb.getBakery(),
				thumbnailMap.get(cb.getBakery().getId()),
				0L, false))
			.toList();
		return CourseDetailResponse.from(course, bakeries);
	}

    @Transactional
    public Long createManual(Long userId, ManualCourseRequest request) {
		if (request.getBakeryIds() == null || request.getBakeryIds().isEmpty()) {
			throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
		}

        ManualCourseInfo manualCourseInfo = ManualCourseInfo.builder()
                .editorPick(request.isEditorPick())
                .region(request.getRegion())
                .theme(request.getTheme())
                .breadType(request.getBreadType())
                .build();

        Course course = Course.createManual(
                request.getName(),
                request.getThumbnailUrl(),
                request.getEstimatedTime(),
                request.getEstimatedCost(),
                manualCourseInfo
        );

        Course saved = courseRepository.save(course);

		List<Long> bakeryIds = request.getBakeryIds();
		List<Bakery> bakeries = bakeryRepository.findAllById(bakeryIds);

		// bakeryIds 중복 시 (같은 빵집이 여러 개 존재하는 경우) 에러 발생
		if (bakeryIds.size() != new HashSet<>(bakeryIds).size()) {
			throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
		}

		Map<Long, Bakery> bakeryMap = bakeries.stream()
				.collect(Collectors.toMap(Bakery::getId, b -> b));

		List<Long> notFoundIds = bakeryIds.stream()
				.filter(id -> !bakeryMap.containsKey(id))
				.toList();

		if (!notFoundIds.isEmpty()) {
			throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
		}

		IntStream.range(0, bakeryIds.size())
				.forEach(index -> {
					CourseBakery courseBakery = CourseBakery.builder()
							.bakery(bakeryMap.get(bakeryIds.get(index)))
							.course(saved)
							.visitOrder(index + 1)
							.build();
					saved.addCourseBakery(courseBakery);
				});

        log.info("MANUAL 코스 생성: courseId={}, userId={}", saved.getId(), userId);
        return saved.getId();
    }

    @Transactional
    public void updateManual(Long courseId, UpdateCourseRequest request) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

        ManualCourseInfo manualCourseInfo = null;
        if (request.getEditorPick() != null || request.getRegion() != null
                || request.getTheme() != null || request.getBreadType() != null) {
            ManualCourseInfo current = course.getManualCourseInfo();
            manualCourseInfo = ManualCourseInfo.builder()
                    .editorPick(request.getEditorPick() != null ? request.getEditorPick() : (current != null && current.isEditorPick()))
                    .region(request.getRegion() != null ? request.getRegion() : (current != null ? current.getRegion() : null))
                    .theme(request.getTheme() != null ? request.getTheme() : (current != null ? current.getTheme() : null))
                    .breadType(request.getBreadType() != null ? request.getBreadType() : (current != null ? current.getBreadType() : null))
                    .build();
        }

        course.updateManual(
                request.getName(),
                request.getThumbnailUrl(),
                request.getEstimatedTime(),
                request.getEstimatedCost(),
                manualCourseInfo
        );

        if (request.getBakeryIds() != null) {
            List<Long> bakeryIds = request.getBakeryIds();
			if (bakeryIds.isEmpty()) {
				throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
			}
            if (bakeryIds.size() != new HashSet<>(bakeryIds).size()) {
                throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
            }

            List<Bakery> bakeries = bakeryRepository.findAllById(bakeryIds);
            Map<Long, Bakery> bakeryMap = bakeries.stream()
                    .collect(Collectors.toMap(Bakery::getId, b -> b));

            List<Long> notFoundIds = bakeryIds.stream()
                    .filter(id -> !bakeryMap.containsKey(id))
                    .toList();

            if (!notFoundIds.isEmpty()) {
                throw new CustomException(ErrorCode.BAKERY_NOT_FOUND);
            }

            course.clearCourseBakeries();

            IntStream.range(0, bakeryIds.size())
                    .forEach(index -> {
                        CourseBakery courseBakery = CourseBakery.builder()
                                .bakery(bakeryMap.get(bakeryIds.get(index)))
                                .visitOrder(index + 1)
                                .build();
                        course.addCourseBakery(courseBakery);
                    });
        }

        log.info("MANUAL 코스 수정: courseId={}", courseId);
    }

    @Transactional
    public void delete(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));
        courseRepository.delete(course);
        log.info("코스 삭제: courseId={}", courseId);
    }

    @Transactional
    public Long createAi(Long userId, AiCourseRequest request) {
        // TODO: AI 서버 연동 후 구현
        throw new CustomException(ErrorCode.FEATURE_NOT_IMPLEMENTED);
    }

	@Transactional
	public void deleteAi(Long courseId, Long userId) {
		Course course = courseRepository.findById(courseId)
			.orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));

		if (course.getCourseType() != CourseType.AI) {
			throw new CustomException(ErrorCode.NOT_AI_COURSE);
		}
		if (!course.getUser().getId().equals(userId)) {
			throw new CustomException(ErrorCode.FORBIDDEN);
		}

		courseRepository.delete(course);
		log.info("AI 코스 삭제: courseId={}, userId={}", courseId, userId);
	}
}

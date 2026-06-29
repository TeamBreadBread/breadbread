package com.breadbread.course.service;

import com.breadbread.bakery.dto.request.BakerySearch;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.course.dto.response.DrivingRouteResponse;
import com.breadbread.course.dto.response.ModifyCourseBakeryResponse;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import com.breadbread.course.entity.RouteMode;
import com.breadbread.course.repository.CourseBakeryRepository;
import com.breadbread.course.repository.CourseRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.global.util.GeoDistance;
import com.breadbread.user.entity.UserRole;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class CourseBakeryMutationService {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final CourseRepository courseRepository;
    private final CourseBakeryRepository courseBakeryRepository;
    private final BakeryRepository bakeryRepository;
    private final CourseDrivingRouteService courseDrivingRouteService;

    @Transactional
    public ModifyCourseBakeryResponse excludeBakery(
            Long courseId, Long userId, UserRole role, Long bakeryId) {
        Course course = loadEditableCourse(courseId, userId, role);
        List<CourseBakery> activeBakeries = activeCourseBakeries(courseId);

        if (activeBakeries.size() <= 1) {
            throw new CustomException(ErrorCode.COURSE_BAKERY_REQUIRED);
        }

        CourseBakery target =
                activeBakeries.stream()
                        .filter(cb -> cb.getBakery().getId().equals(bakeryId))
                        .findFirst()
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        String targetName = target.getBakery().getName();
        course.getCourseBakeries().remove(target);
        courseBakeryRepository.delete(target);

        List<CourseBakery> remaining =
                activeBakeries.stream()
                        .filter(cb -> !cb.getBakery().getId().equals(bakeryId))
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .toList();
        renumberVisitOrders(remaining);

        return buildResponse(course, courseId, target.getBakery().getId(), targetName, null, null);
    }

    @Transactional
    public ModifyCourseBakeryResponse replaceBakery(
            Long courseId, Long userId, UserRole role, Long bakeryId, Long replacementBakeryId) {
        Course course = loadEditableCourse(courseId, userId, role);
        List<CourseBakery> activeBakeries = activeCourseBakeries(courseId);

        CourseBakery target =
                activeBakeries.stream()
                        .filter(cb -> cb.getBakery().getId().equals(bakeryId))
                        .findFirst()
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        Bakery targetBakery = target.getBakery();
        Set<Long> currentIds =
                activeBakeries.stream()
                        .map(cb -> cb.getBakery().getId())
                        .collect(Collectors.toCollection(HashSet::new));

        Bakery replacement =
                resolveReplacementBakery(targetBakery, replacementBakeryId, currentIds);
        if (isClosedToday(replacement)) {
            throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
        }

        target.replaceBakery(replacement);

        return buildResponse(
                course,
                courseId,
                targetBakery.getId(),
                targetBakery.getName(),
                replacement.getId(),
                replacement.getName());
    }

    private Course loadEditableCourse(Long courseId, Long userId, UserRole role) {
        Course course =
                courseRepository
                        .findByIdAndActiveTrue(courseId)
                        .orElseThrow(() -> new CustomException(ErrorCode.COURSE_NOT_FOUND));
        validateEditAccess(course, userId, role);
        return course;
    }

    private List<CourseBakery> activeCourseBakeries(Long courseId) {
        return courseBakeryRepository.findAllByCourseId(courseId).stream()
                .filter(cb -> cb.getBakery().isActive())
                .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                .toList();
    }

    private void renumberVisitOrders(List<CourseBakery> bakeries) {
        for (int i = 0; i < bakeries.size(); i++) {
            bakeries.get(i).setVisitOrder(i + 1);
        }
    }

    private ModifyCourseBakeryResponse buildResponse(
            Course course,
            Long courseId,
            Long targetBakeryId,
            String targetBakeryName,
            Long replacementBakeryId,
            String replacementBakeryName) {
        courseDrivingRouteService.invalidateCache(courseId);

        List<CourseBakery> ordered =
                courseBakeryRepository.findAllByCourseId(courseId).stream()
                        .filter(cb -> cb.getBakery().isActive())
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .toList();

        List<Bakery> orderedBakeries = ordered.stream().map(CourseBakery::getBakery).toList();
        List<Long> bakeryOrder = orderedBakeries.stream().map(Bakery::getId).toList();
        int totalStayMinutes =
                orderedBakeries.stream().mapToInt(Bakery::getEstimatedStayMinutes).sum();

        int estimatedTotalMinutes = 0;
        try {
            DrivingRouteResponse routeResponse =
                    courseDrivingRouteService.fetchAndSaveRoute(
                            course,
                            orderedBakeries,
                            orderedBakeries.stream().map(Bakery::getEstimatedStayMinutes).toList(),
                            totalStayMinutes,
                            RouteMode.DRIVING);
            estimatedTotalMinutes = routeResponse.getTotalMinutes();
            course.updateTotalMinutes(estimatedTotalMinutes);
        } catch (CustomException e) {
            log.warn(
                    "코스 빵집 변경 후 경로 갱신 실패: courseId={}, error={}",
                    courseId,
                    e.getErrorCode().name());
        }

        return ModifyCourseBakeryResponse.builder()
                .courseId(courseId)
                .bakeryOrder(bakeryOrder)
                .estimatedTotalMinutes(estimatedTotalMinutes)
                .targetBakeryId(targetBakeryId)
                .targetBakeryName(targetBakeryName)
                .replacementBakeryId(replacementBakeryId)
                .replacementBakeryName(replacementBakeryName)
                .build();
    }

    private Bakery resolveReplacementBakery(
            Bakery targetBakery, Long replacementBakeryId, Set<Long> currentCourseBakeryIds) {
        if (replacementBakeryId != null) {
            if (currentCourseBakeryIds.contains(replacementBakeryId)) {
                throw new CustomException(ErrorCode.INVALID_INPUT_VALUE);
            }
            Bakery replacement =
                    bakeryRepository
                            .findByIdAndActiveTrueAndStatus(
                                    replacementBakeryId, BakeryStatus.APPROVED)
                            .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
            return replacement;
        }

        BakerySearch search =
                BakerySearch.builder()
                        .region(
                                StringUtils.hasText(targetBakery.getRegion())
                                        ? targetBakery.getRegion()
                                        : null)
                        .dong(
                                StringUtils.hasText(targetBakery.getDong())
                                        ? targetBakery.getDong()
                                        : null)
                        .open(true)
                        .userLat(targetBakery.getLatitude())
                        .userLng(targetBakery.getLongitude())
                        .sort(com.breadbread.bakery.entity.enums.BakerySortType.NEARBY)
                        .radiusMeters(5000)
                        .build();

        List<Bakery> candidates =
                bakeryRepository.search(search, PageRequest.of(0, 30)).getContent().stream()
                        .filter(b -> !currentCourseBakeryIds.contains(b.getId()))
                        .filter(b -> !b.getId().equals(targetBakery.getId()))
                        .filter(b -> !isClosedToday(b))
                        .sorted(
                                Comparator.comparingDouble(
                                        b ->
                                                GeoDistance.metersBetween(
                                                        targetBakery.getLatitude(),
                                                        targetBakery.getLongitude(),
                                                        b.getLatitude(),
                                                        b.getLongitude())))
                        .toList();

        return candidates.stream()
                .findFirst()
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
    }

    private boolean isClosedToday(Bakery bakery) {
        DayOfWeek today = LocalDate.now(SEOUL).getDayOfWeek();
        Set<DayOfWeek> closedDays = bakery.getClosedDays();
        return closedDays != null && closedDays.contains(today);
    }

    private void validateEditAccess(Course course, Long userId, UserRole role) {
        if (role == UserRole.ROLE_ADMIN) return;
        if (course.getUser() == null || !course.getUser().getId().equals(userId)) {
            throw new CustomException(ErrorCode.FORBIDDEN);
        }
    }
}

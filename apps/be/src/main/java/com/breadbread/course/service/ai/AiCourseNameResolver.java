package com.breadbread.course.service.ai;

import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.course.dto.ai.RecommendedBakeryResponse;
import com.breadbread.course.entity.Course;
import com.breadbread.course.entity.CourseBakery;
import java.util.Comparator;
import java.util.List;
import java.util.regex.Pattern;

public final class AiCourseNameResolver {

    private static final int MAX_NAME_LENGTH = 80;
    private static final Pattern GENERIC_NAME_PATTERN =
            Pattern.compile(
                    "^(빵텔리전[스트]?|BreadBread|AI)\\s*(추천(\\s*(투어|코스)?)?)?\\s*$",
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private AiCourseNameResolver() {}

    public static String resolve(AiCourseWebhookResponse response) {
        return resolveInternal(
                response.getName(),
                response.getTheme(),
                response.getSummary(),
                bakeryNamesFrom(response));
    }

    public static String resolve(Course course) {
        List<String> bakeryNames =
                course.getCourseBakeries().stream()
                        .sorted(Comparator.comparingInt(CourseBakery::getVisitOrder))
                        .map(cb -> cb.getBakery().getName())
                        .filter(name -> name != null && !name.isBlank())
                        .toList();
        return resolveInternal(
                course.getName(), course.getTheme(), course.getSummary(), bakeryNames);
    }

    public static boolean isGenericPlaceholder(String value) {
        if (value == null || value.isBlank()) {
            return true;
        }
        String trimmed = value.trim();
        if (GENERIC_NAME_PATTERN.matcher(trimmed).matches()) {
            return true;
        }
        return trimmed.startsWith("빵텔리전");
    }

    private static String resolveInternal(
            String name, String theme, String summary, List<String> bakeryNames) {
        if (hasMeaningfulName(name)) {
            return truncate(name.trim());
        }
        if (hasMeaningfulName(theme)) {
            return truncate(theme.trim());
        }
        if (hasMeaningfulName(summary)) {
            return truncate(firstLine(summary.trim()));
        }
        return buildFromBakeries(bakeryNames);
    }

    private static boolean hasMeaningfulName(String value) {
        return value != null && !value.isBlank() && !isGenericPlaceholder(value);
    }

    private static String buildFromBakeries(List<String> bakeryNames) {
        if (bakeryNames == null || bakeryNames.isEmpty()) {
            return "AI 추천 빵 코스";
        }
        if (bakeryNames.size() == 1) {
            return truncate(bakeryNames.get(0) + " 빵투어");
        }
        String joined = String.join(" · ", bakeryNames.subList(0, Math.min(2, bakeryNames.size())));
        return truncate(joined + " 코스");
    }

    private static List<String> bakeryNamesFrom(AiCourseWebhookResponse response) {
        if (response.getBakeries() == null) {
            return List.of();
        }
        return response.getBakeries().stream()
                .sorted(Comparator.comparingInt(RecommendedBakeryResponse::getOrder))
                .map(RecommendedBakeryResponse::getName)
                .filter(name -> name != null && !name.isBlank())
                .toList();
    }

    private static String firstLine(String text) {
        int newline = text.indexOf('\n');
        return newline >= 0 ? text.substring(0, newline).trim() : text;
    }

    private static String truncate(String value) {
        if (value.length() <= MAX_NAME_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_NAME_LENGTH - 1) + "…";
    }
}

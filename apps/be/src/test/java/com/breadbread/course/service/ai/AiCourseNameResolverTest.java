package com.breadbread.course.service.ai;

import static org.assertj.core.api.Assertions.assertThat;

import com.breadbread.course.dto.ai.AiCourseWebhookResponse;
import com.breadbread.course.dto.ai.RecommendedBakeryResponse;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AiCourseNameResolverTest {

    @Test
    void keeps_creative_name_from_webhook() {
        AiCourseWebhookResponse response = webhook("성심당 달콤한 오후 코스", "테마", "요약", List.of());

        assertThat(AiCourseNameResolver.resolve(response)).isEqualTo("성심당 달콤한 오후 코스");
    }

    @Test
    void falls_back_to_theme_when_name_is_generic() {
        AiCourseWebhookResponse response =
                webhook("빵텔리전스 추천", "혼자 즐기는 조용한 빵 산책", "요약", List.of());

        assertThat(AiCourseNameResolver.resolve(response))
                .isEqualTo("혼자 즐기는 조용한 빵 산책");
    }

    @Test
    void falls_back_to_summary_when_name_and_theme_are_generic() {
        AiCourseWebhookResponse response =
                webhook("빵텔리전스 추천 투어", "빵텔리전스 추천", "대전 중구 클래식 빵집 투어", List.of());

        assertThat(AiCourseNameResolver.resolve(response)).isEqualTo("대전 중구 클래식 빵집 투어");
    }

    @Test
    void builds_name_from_bakeries_when_all_fields_are_generic() {
        RecommendedBakeryResponse first = bakery(1, 1, "성심당");
        RecommendedBakeryResponse second = bakery(2, 2, "뚜레쥬르");
        AiCourseWebhookResponse response =
                webhook("빵텔리전스 추천 코스", "빵텔리전스 추천", "빵텔리전스 추천", List.of(first, second));

        assertThat(AiCourseNameResolver.resolve(response)).isEqualTo("성심당 · 뚜레쥬르 코스");
    }

    @Test
    void detects_generic_placeholder_names() {
        assertThat(AiCourseNameResolver.isGenericPlaceholder("빵텔리전스 추천")).isTrue();
        assertThat(AiCourseNameResolver.isGenericPlaceholder("빵텔리전스 추천 투어")).isTrue();
        assertThat(AiCourseNameResolver.isGenericPlaceholder("빵텔리전스 추천 코스")).isTrue();
        assertThat(AiCourseNameResolver.isGenericPlaceholder("성심당 달콤 코스")).isFalse();
    }

    private static AiCourseWebhookResponse webhook(
            String name, String theme, String summary, List<RecommendedBakeryResponse> bakeries) {
        AiCourseWebhookResponse response = new AiCourseWebhookResponse();
        ReflectionTestUtils.setField(response, "name", name);
        ReflectionTestUtils.setField(response, "theme", theme);
        ReflectionTestUtils.setField(response, "summary", summary);
        ReflectionTestUtils.setField(response, "bakeries", bakeries);
        return response;
    }

    private static RecommendedBakeryResponse bakery(long id, int order, String name) {
        RecommendedBakeryResponse bakery = new RecommendedBakeryResponse();
        ReflectionTestUtils.setField(bakery, "id", id);
        ReflectionTestUtils.setField(bakery, "order", order);
        ReflectionTestUtils.setField(bakery, "name", name);
        return bakery;
    }
}

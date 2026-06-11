package com.breadbread.bakery.repository;

import com.breadbread.bakery.dto.BakeryAiSearch;
import com.breadbread.bakery.dto.BakerySearch;
import com.breadbread.bakery.entity.*;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.core.types.dsl.NumberTemplate;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
public class BakeryRepositoryImpl implements BakeryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Bakery> search(BakerySearch search, Pageable pageable) {
        QBakery bakery = QBakery.bakery;
        QReview review = QReview.review;
        QBakeryLike like = QBakeryLike.bakeryLike;

        BooleanExpression keyword = containKeyword(bakery, search.getKeyword());
        BooleanExpression region = eqRegion(bakery, search.getRegion());
        BooleanExpression dong = eqDong(bakery, search.getDong());
        BooleanExpression active = bakery.active.isTrue();
        BooleanExpression approved =
                bakery.status.eq(com.breadbread.bakery.entity.BakeryStatus.APPROVED);
        BooleanExpression withinRadius = withinRadius(bakery, search);
        OrderSpecifier<Integer> openFirst = openFirstOrder(bakery, search.isOpen());

        List<Bakery> content =
                fetchContent(
                        search,
                        bakery,
                        review,
                        like,
                        active,
                        approved,
                        keyword,
                        region,
                        dong,
                        withinRadius,
                        openFirst,
                        pageable);

        Long total =
                queryFactory
                        .select(bakery.count())
                        .from(bakery)
                        .where(active, approved, keyword, region, dong, withinRadius)
                        .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    // 정렬별 쿼리 분기 + 페이징 한 곳에서 처리
    private List<Bakery> fetchContent(
            BakerySearch search,
            QBakery bakery,
            QReview review,
            QBakeryLike like,
            BooleanExpression active,
            BooleanExpression approved,
            BooleanExpression keyword,
            BooleanExpression region,
            BooleanExpression dong,
            BooleanExpression withinRadius,
            OrderSpecifier<Integer> openFirst,
            Pageable pageable) {

        BakerySortType sort = search.getSort();

        if (sort == BakerySortType.REVIEW_COUNT) {
            return applyPaging(
                    queryFactory
                            .selectFrom(bakery)
                            .leftJoin(review)
                            .on(review.bakery.eq(bakery).and(review.active.isTrue()))
                            .where(active, approved, keyword, region, dong, withinRadius)
                            .groupBy(bakery.id)
                            .orderBy(openFirst, review.count().desc(), bakery.id.desc()),
                    pageable);
        }
        if (sort == BakerySortType.LIKE_COUNT) {
            return applyPaging(
                    queryFactory
                            .selectFrom(bakery)
                            .leftJoin(like)
                            .on(like.bakery.eq(bakery))
                            .where(active, approved, keyword, region, dong, withinRadius)
                            .groupBy(bakery.id)
                            .orderBy(openFirst, like.count().desc(), bakery.id.desc()),
                    pageable);
        }
        if (sort == BakerySortType.NEARBY
                && search.getUserLat() != null
                && search.getUserLng() != null) {
            return applyPaging(
                    queryFactory
                            .selectFrom(bakery)
                            .where(active, approved, keyword, region, dong, withinRadius)
                            .orderBy(
                                    openFirst,
                                    distanceTemplate(
                                                    bakery,
                                                    search.getUserLng(),
                                                    search.getUserLat())
                                            .asc(),
                                    bakery.id.asc()),
                    pageable);
        }
        return applyPaging(
                queryFactory
                        .selectFrom(bakery)
                        .where(active, approved, keyword, region, dong, withinRadius)
                        .orderBy(openFirst, defaultOrder(sort, bakery)[0], bakery.id.desc()),
                pageable);
    }

    private List<Bakery> applyPaging(JPAQuery<Bakery> query, Pageable pageable) {
        return query.offset(pageable.getOffset()).limit(pageable.getPageSize()).fetch();
    }

    private OrderSpecifier<?>[] defaultOrder(BakerySortType sort, QBakery bakery) {
        if (sort == BakerySortType.RATING) {
            return new OrderSpecifier<?>[] {
                new OrderSpecifier<>(
                        Order.DESC, bakery.rating, OrderSpecifier.NullHandling.NullsLast),
                bakery.id.desc()
            };
        }
        return new OrderSpecifier<?>[] {bakery.id.desc()};
    }

    private BooleanExpression containKeyword(QBakery bakery, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return null;
        }
        return bakery.name.contains(keyword);
    }

    private BooleanExpression isOpenAt(QBakery bakery, DayOfWeek dayOfWeek, LocalTime time) {
        boolean isWeekend = (dayOfWeek == DayOfWeek.SATURDAY || dayOfWeek == DayOfWeek.SUNDAY);

        BooleanExpression hoursNotNull =
                isWeekend
                        ? bakery.businessHours
                                .weekendOpen
                                .isNotNull()
                                .and(bakery.businessHours.weekendClose.isNotNull())
                        : bakery.businessHours
                                .weekdayOpen
                                .isNotNull()
                                .and(bakery.businessHours.weekdayClose.isNotNull());

        BooleanExpression timeCondition =
                isWeekend
                        ? bakery.businessHours
                                .weekendOpen
                                .loe(time)
                                .and(bakery.businessHours.weekendClose.goe(time))
                        : bakery.businessHours
                                .weekdayOpen
                                .loe(time)
                                .and(bakery.businessHours.weekdayClose.goe(time));

        return hoursNotNull.and(bakery.closedDays.contains(dayOfWeek).not()).and(timeCondition);
    }

    // 영업 중 우선 정렬 (open=true면 영업 중 먼저, false면 순서 무관)
    private OrderSpecifier<Integer> openFirstOrder(QBakery bakery, boolean open) {
        if (!open) return new OrderSpecifier<>(Order.ASC, Expressions.constant(0));

        NumberExpression<Integer> openScore =
                new CaseBuilder()
                        .when(
                                isOpenAt(
                                        bakery,
                                        LocalDate.now(ZoneId.of("Asia/Seoul")).getDayOfWeek(),
                                        LocalTime.now(ZoneId.of("Asia/Seoul"))))
                        .then(0)
                        .otherwise(1);

        return openScore.asc();
    }

    private NumberTemplate<Double> distanceTemplate(
            QBakery bakery, double userLng, double userLat) {
        return Expressions.numberTemplate(
                Double.class,
                "ST_DistanceSphere({0}, ST_SetSRID(ST_MakePoint({1}, {2}), 4326))",
                bakery.location,
                userLng,
                userLat);
    }

    private BooleanExpression withinRadius(QBakery bakery, BakerySearch search) {
        if (search.getRadiusMeters() == null
                || search.getUserLat() == null
                || search.getUserLng() == null) {
            return null;
        }
        return distanceTemplate(bakery, search.getUserLng(), search.getUserLat())
                .loe(search.getRadiusMeters().doubleValue());
    }

    private BooleanExpression eqRegion(QBakery bakery, String region) {
        return StringUtils.hasText(region) ? bakery.region.eq(region) : null;
    }

    private BooleanExpression eqDong(QBakery bakery, String dong) {
        return StringUtils.hasText(dong) ? bakery.dong.eq(dong) : null;
    }

    @Override
    public List<Bakery> searchForAi(BakeryAiSearch search) {
        QBakery bakery = QBakery.bakery;

        List<BooleanExpression> conditions = new ArrayList<>();
        conditions.add(bakery.active.isTrue());
        conditions.add(bakery.status.eq(com.breadbread.bakery.entity.BakeryStatus.APPROVED));
        conditions.add(containKeyword(bakery, search.getKeyword()));
        conditions.add(eqRegion(bakery, search.getRegion()));
        conditions.add(eqDrinkAvailable(bakery, search.getDrinkAvailable()));
        conditions.add(eqDineInAvailable(bakery, search.getDineInAvailable()));
        conditions.add(eqBakeryType(bakery, search.getBakeryType()));
        conditions.add(containsAnyUseType(bakery, search.getBakeryUseTypes()));
        conditions.add(containsAnyPersonality(bakery, search.getBakeryPersonalities()));
        if (search.isOpen()) {
            DayOfWeek dayOfWeek =
                    (search.getVisitDate() != null
                                    ? search.getVisitDate()
                                    : LocalDate.now(ZoneId.of("Asia/Seoul")))
                            .getDayOfWeek();
            LocalTime time =
                    search.getVisitTime() != null
                            ? search.getVisitTime()
                            : LocalTime.now(ZoneId.of("Asia/Seoul"));
            conditions.add(isOpenAt(bakery, dayOfWeek, time));
        }

        BooleanExpression[] where =
                conditions.stream().filter(c -> c != null).toArray(BooleanExpression[]::new);

        return queryFactory.selectFrom(bakery).where(where).orderBy(bakery.id.desc()).fetch();
    }

    private BooleanExpression eqDrinkAvailable(QBakery bakery, Boolean drinkAvailable) {
        return drinkAvailable != null ? bakery.drinkAvailable.eq(drinkAvailable) : null;
    }

    private BooleanExpression eqDineInAvailable(QBakery bakery, Boolean dineInAvailable) {
        return dineInAvailable != null ? bakery.dineInAvailable.eq(dineInAvailable) : null;
    }

    private BooleanExpression eqBakeryType(QBakery bakery, BakeryType bakeryType) {
        return bakeryType != null ? bakery.bakeryType.eq(bakeryType) : null;
    }

    private BooleanExpression containsAnyUseType(QBakery bakery, List<BakeryUseType> useTypes) {
        if (useTypes == null || useTypes.isEmpty()) return null;
        BooleanExpression expr = bakery.bakeryUseTypes.any().eq(useTypes.get(0));
        for (int i = 1; i < useTypes.size(); i++) {
            expr = expr.or(bakery.bakeryUseTypes.any().eq(useTypes.get(i)));
        }
        return expr;
    }

    private BooleanExpression containsAnyPersonality(
            QBakery bakery, List<BakeryPersonality> personalities) {
        if (personalities == null || personalities.isEmpty()) return null;
        BooleanExpression expr = bakery.bakeryPersonalities.any().eq(personalities.get(0));
        for (int i = 1; i < personalities.size(); i++) {
            expr = expr.or(bakery.bakeryPersonalities.any().eq(personalities.get(i)));
        }
        return expr;
    }
}

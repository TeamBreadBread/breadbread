package com.breadbread.bakery.repository;

import com.breadbread.bakery.dto.BakerySearch;
import com.breadbread.bakery.entity.*;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.core.types.dsl.CaseBuilder;
import com.querydsl.core.types.dsl.Expressions;
import com.querydsl.core.types.dsl.NumberExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
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
        OrderSpecifier<Integer> openFirst = openFirstOrder(bakery, search.isOpen());

        List<Bakery> content =
                fetchContent(
                        search.getSort(),
                        bakery,
                        review,
                        like,
                        keyword,
                        region,
                        openFirst,
                        pageable);

        Long total =
                queryFactory.select(bakery.count()).from(bakery).where(keyword, region).fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    // 정렬별 쿼리 분기 + 페이징 한 곳에서 처리
    private List<Bakery> fetchContent(
            BakerySortType sort,
            QBakery bakery,
            QReview review,
            QBakeryLike like,
            BooleanExpression keyword,
            BooleanExpression region,
            OrderSpecifier<Integer> openFirst,
            Pageable pageable) {

        if (sort == BakerySortType.REVIEW_COUNT) {
            return applyPaging(
                    queryFactory
                            .selectFrom(bakery)
                            .leftJoin(review)
                            .on(review.bakery.eq(bakery))
                            .where(keyword, region)
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
                            .where(keyword, region)
                            .groupBy(bakery.id)
                            .orderBy(openFirst, like.count().desc(), bakery.id.desc()),
                    pageable);
        }
        return applyPaging(
                queryFactory
                        .selectFrom(bakery)
                        .where(keyword, region)
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
        BooleanExpression byName = bakery.name.contains(keyword);
        BooleanExpression byAddress =
                bakery.address.isNotNull().and(bakery.address.contains(keyword));
        BooleanExpression byRegion =
                bakery.region.isNotNull().and(bakery.region.contains(keyword));
        return byName.or(byAddress).or(byRegion);
    }

    private BooleanExpression isOpenNow(QBakery bakery) {
        DayOfWeek today = LocalDate.now().getDayOfWeek();
        LocalTime now = LocalTime.now();
        boolean isWeekend = (today == DayOfWeek.SATURDAY || today == DayOfWeek.SUNDAY);

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
                                .loe(now)
                                .and(bakery.businessHours.weekendClose.goe(now))
                        : bakery.businessHours
                                .weekdayOpen
                                .loe(now)
                                .and(bakery.businessHours.weekdayClose.goe(now));

        return hoursNotNull.and(bakery.closedDays.contains(today).not()).and(timeCondition);
    }

    // 영업 중 우선 정렬 (open=true면 영업 중 먼저, false면 순서 무관)
    private OrderSpecifier<Integer> openFirstOrder(QBakery bakery, boolean open) {
        if (!open) return new OrderSpecifier<>(Order.ASC, Expressions.constant(0));

        NumberExpression<Integer> openScore =
                new CaseBuilder().when(isOpenNow(bakery)).then(0).otherwise(1);

        return openScore.asc();
    }

    private BooleanExpression eqRegion(QBakery bakery, String region) {
        return StringUtils.hasText(region) ? bakery.region.eq(region) : null;
    }
}

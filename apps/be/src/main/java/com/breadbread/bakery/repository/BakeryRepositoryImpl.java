package com.breadbread.bakery.repository;

import com.breadbread.bakery.dto.BakerySearch;
import com.breadbread.bakery.entity.*;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQuery;
import com.querydsl.jpa.impl.JPAQueryFactory;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
@RequiredArgsConstructor
public class BakeryRepositoryImpl implements BakeryRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Bakery> search(BakerySearch search, Pageable pageable) {
        QBakery bakery = QBakery.bakery;
        QReview review = QReview.review;
        QBakeryLike like = QBakeryLike.bakeryLike;

        BooleanExpression keyword = containKeyword(bakery, search.getKeyword());
        BooleanExpression open = isOpenNow(bakery, search.isOpen());
        BooleanExpression region = eqRegion(bakery, search.getRegion());

        List<Bakery> content = fetchContent(search.getSort(), bakery, review, like, keyword, open, region, pageable);

        Long total = queryFactory
                .select(bakery.count())
                .from(bakery)
                .where(keyword, open, region)
                .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    // 정렬별 쿼리 분기 + 페이징 한 곳에서 처리
    private List<Bakery> fetchContent(BakerySortType sort, QBakery bakery,
                                      QReview review, QBakeryLike like,
                                      BooleanExpression keyword, BooleanExpression open,
                                      BooleanExpression region, Pageable pageable) {

        if (sort == BakerySortType.REVIEW_COUNT) {
            return applyPaging(queryFactory.selectFrom(bakery)
                    .leftJoin(review).on(review.bakery.eq(bakery))
                    .where(keyword, open, region)
                    .groupBy(bakery.id)
                    .orderBy(review.count().desc(), bakery.id.desc()), pageable);
        }
        if (sort == BakerySortType.LIKE_COUNT) {
            return applyPaging(queryFactory.selectFrom(bakery)
                    .leftJoin(like).on(like.bakery.eq(bakery))
                    .where(keyword, open, region)
                    .groupBy(bakery.id)
                    .orderBy(like.count().desc(), bakery.id.desc()), pageable);
        }
        return applyPaging(queryFactory.selectFrom(bakery)
                .where(keyword, open, region)
                .orderBy(defaultOrder(sort, bakery)), pageable);
    }

    private List<Bakery> applyPaging(JPAQuery<Bakery> query, Pageable pageable) {
        return query
                .offset(pageable.getOffset())
                .limit(pageable.getPageSize())
                .fetch();
    }

    private OrderSpecifier<?>[] defaultOrder(BakerySortType sort, QBakery bakery) {
        if (sort == BakerySortType.RATING) {
            return new OrderSpecifier<?>[]{
                    new OrderSpecifier<>(Order.DESC, bakery.rating, OrderSpecifier.NullHandling.NullsLast),
                    bakery.id.desc()
            };
        }
        return new OrderSpecifier<?>[]{bakery.id.desc()};
    }

    private BooleanExpression containKeyword(QBakery bakery, String keyword) {
        return StringUtils.hasText(keyword) ? bakery.name.contains(keyword) : null;
    }

    private BooleanExpression isOpenNow(QBakery bakery, boolean open) {
        if (!open) return null;

        DayOfWeek today = LocalDate.now().getDayOfWeek();
        LocalTime now = LocalTime.now();
        boolean isWeekend = (today == DayOfWeek.SATURDAY || today == DayOfWeek.SUNDAY);

        BooleanExpression timeCondition = isWeekend
                ? bakery.businessHours.weekendOpen.loe(now)
                .and(bakery.businessHours.weekendClose.goe(now))
                : bakery.businessHours.weekdayOpen.loe(now)
                .and(bakery.businessHours.weekdayClose.goe(now));

        return bakery.closedDays.contains(today).not().and(timeCondition);
    }

    private BooleanExpression eqRegion(QBakery bakery, String region) {
        return StringUtils.hasText(region) ? bakery.region.eq(region) : null;
    }
}

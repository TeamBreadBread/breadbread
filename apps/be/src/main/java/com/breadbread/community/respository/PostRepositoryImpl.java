package com.breadbread.community.respository;

import com.breadbread.community.dto.PostSearch;
import com.breadbread.community.entity.Post;
import com.breadbread.community.entity.QPost;
import com.querydsl.core.types.dsl.BooleanExpression;
import com.querydsl.jpa.impl.JPAQueryFactory;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.util.StringUtils;

@RequiredArgsConstructor
public class PostRepositoryImpl implements PostRepositoryCustom {

    private final JPAQueryFactory queryFactory;

    @Override
    public Page<Post> searchPosts(PostSearch search, Pageable pageable) {
        QPost post = QPost.post;

        BooleanExpression typeCondition = post.postType.in(search.getPostTypes());
        BooleanExpression keywordCondition = containsKeyword(post, search.getKeyword());

        List<Post> content =
                queryFactory
                        .selectFrom(post)
                        .where(typeCondition, keywordCondition)
                        .orderBy(post.id.desc())
                        .offset(pageable.getOffset())
                        .limit(pageable.getPageSize())
                        .fetch();

        Long total =
                queryFactory
                        .select(post.count())
                        .from(post)
                        .where(typeCondition, keywordCondition)
                        .fetchOne();

        return new PageImpl<>(content, pageable, total != null ? total : 0L);
    }

    private BooleanExpression containsKeyword(QPost post, String keyword) {
        return StringUtils.hasText(keyword) ? post.title.contains(keyword) : null;
    }
}

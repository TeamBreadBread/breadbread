package com.breadbread.community.respository;

import com.breadbread.community.entity.PostLike;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostLikeRepository extends JpaRepository<PostLike, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    Optional<PostLike> findByUserIdAndPostId(Long userId, Long postId);

    void deleteByUserIdAndPostId(Long userId, Long postId);

    long countByPostId(Long postId);

    @Query(
            "SELECT pl.post.id, COUNT(pl) FROM PostLike pl WHERE pl.post.id IN :postIds GROUP BY pl.post.id")
    List<Object[]> countByPostIdIn(@Param("postIds") List<Long> postIds);
}

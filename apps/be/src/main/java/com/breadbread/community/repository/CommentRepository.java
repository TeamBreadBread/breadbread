package com.breadbread.community.repository;

import com.breadbread.community.entity.Comment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Optional<Comment> findByIdAndPostIdAndActiveTrue(Long id, Long postId);

    @Modifying
    @Query("UPDATE Comment c SET c.active = false WHERE c.post.id = :postId")
    void deactivateAllByPostId(@Param("postId") Long postId);

    @Query(
            "SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId AND c.active = true ORDER BY c.createdAt ASC")
    List<Comment> findAllByPostIdWithUserOrderByCreatedAtAsc(@Param("postId") Long postId);

    @Query(
            "SELECT c.post.id, COUNT(c) FROM Comment c WHERE c.post.id IN :postIds AND c.active = true GROUP BY c.post.id")
    List<Object[]> countByPostIdIn(@Param("postIds") List<Long> postIds);

    long countByPostIdAndActiveTrue(Long postId);
}

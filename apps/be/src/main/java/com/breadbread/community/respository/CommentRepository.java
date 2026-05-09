package com.breadbread.community.respository;

import com.breadbread.community.entity.Comment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Optional<Comment> findByIdAndPostId(Long id, Long postId);

    @Query(
            "SELECT c FROM Comment c JOIN FETCH c.user WHERE c.post.id = :postId ORDER BY c.createdAt ASC")
    List<Comment> findAllByPostIdWithUserOrderByCreatedAtAsc(@Param("postId") Long postId);

    @Query(
            "SELECT c.post.id, COUNT(c) FROM Comment c WHERE c.post.id IN :postIds GROUP BY c.post.id")
    List<Object[]> countByPostIdIn(@Param("postIds") List<Long> postIds);

    long countByPostId(Long postId);
}

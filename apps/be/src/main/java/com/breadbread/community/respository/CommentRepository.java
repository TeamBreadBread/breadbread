package com.breadbread.community.respository;

import com.breadbread.community.entity.Comment;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByPostId(Long postId);

    Optional<Comment> findByIdAndPostId(Long id, Long postId);

    List<Comment> findAllByPostIdOrderByCreatedAtAsc(Long postId);

    long countByPostId(Long postId);
}

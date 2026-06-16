package com.breadbread.community.repository;

import com.breadbread.community.entity.Post;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostRepository extends JpaRepository<Post, Long>, PostRepositoryCustom {

    @Query("SELECT p FROM Post p JOIN FETCH p.user WHERE p.id = :id AND p.active = true")
    Optional<Post> findByIdWithUser(@Param("id") Long id);

    Optional<Post> findByIdAndActiveTrue(Long id);

    Page<Post> findAllByUserIdAndActiveTrueOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("SELECT DISTINCT p FROM Post p LEFT JOIN FETCH p.imageUrls WHERE p.id IN :ids")
    List<Post> findAllByIdInWithImageUrls(@Param("ids") List<Long> ids);
}

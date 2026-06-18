package com.breadbread.image.repository;

import com.breadbread.image.entity.TempImage;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TempImageRepository extends JpaRepository<TempImage, Long> {

    Optional<TempImage> findByUrl(String url);

    List<TempImage> findAllByUrlIn(Collection<String> urls);

    List<TempImage> findAllByUploadedAtBefore(LocalDateTime threshold);

    List<TempImage> findAllByUserId(Long userId);
}

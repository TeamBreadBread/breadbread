package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bread;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BreadRepository extends JpaRepository<Bread, Long> {
    List<Bread> findAllByBakeryIdIn(Collection<Long> bakeryIds);

    Optional<Bread> findByIdAndBakeryId(Long id, Long bakeryId);

    void deleteAllByBakeryId(Long bakeryId);
}

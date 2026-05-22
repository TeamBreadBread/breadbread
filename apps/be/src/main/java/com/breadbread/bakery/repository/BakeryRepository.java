package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bakery;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BakeryRepository extends JpaRepository<Bakery, Long>, BakeryRepositoryCustom {
    Optional<Bakery> findByIdAndActiveTrue(Long id);

    boolean existsByIdAndActiveTrue(Long id);

    List<Bakery> findAllByActiveTrue();

    List<Bakery> findAllByIdInAndActiveTrue(List<Long> ids);
}

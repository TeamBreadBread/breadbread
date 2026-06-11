package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BakeryRepository extends JpaRepository<Bakery, Long>, BakeryRepositoryCustom {
    Optional<Bakery> findByIdAndActiveTrue(Long id);

    Optional<Bakery> findByIdAndActiveTrueAndStatus(Long id, BakeryStatus status);

    List<Bakery> findAllByIdInAndActiveTrueAndStatus(List<Long> ids, BakeryStatus status);

    List<Bakery> findAllByActiveTrueAndStatus(BakeryStatus status);

    boolean existsByIdAndActiveTrue(Long id);

    boolean existsByIdAndActiveTrueAndStatus(Long id, BakeryStatus status);

    List<Bakery> findAllByActiveTrue();

    List<Bakery> findAllByIdInAndActiveTrue(List<Long> ids);

    boolean existsByNameAndAddress(String name, String address);

    Optional<Bakery> findFirstByNameAndActiveTrue(String name);

    Page<Bakery> findAllByActiveTrueAndStatus(BakeryStatus status, Pageable pageable);

    Page<Bakery> findAllByActiveTrue(Pageable pageable);
}

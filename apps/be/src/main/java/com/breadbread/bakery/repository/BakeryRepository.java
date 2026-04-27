package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bakery;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BakeryRepository extends JpaRepository<Bakery, Long>, BakeryRepositoryCustom {
}

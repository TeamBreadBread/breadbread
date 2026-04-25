package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bread;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BreadRepository extends JpaRepository<Bread, Long> {
}

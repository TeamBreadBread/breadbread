package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.CrowdTime;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface CrowdTimeRepository extends JpaRepository<CrowdTime, Long> {
    List<CrowdTime> findAllByBakeryIdIn(Collection<Long> bakeryIds);
}

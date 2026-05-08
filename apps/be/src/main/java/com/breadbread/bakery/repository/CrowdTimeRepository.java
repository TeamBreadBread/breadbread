package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.CrowdTime;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CrowdTimeRepository extends JpaRepository<CrowdTime, Long> {
    List<CrowdTime> findAllByBakeryIdIn(Collection<Long> bakeryIds);
}

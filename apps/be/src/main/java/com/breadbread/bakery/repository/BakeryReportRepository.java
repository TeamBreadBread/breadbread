package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.BakeryReport;
import com.breadbread.bakery.entity.BakeryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BakeryReportRepository extends JpaRepository<BakeryReport, Long> {
    Page<BakeryReport> findAllByStatus(BakeryStatus status, Pageable pageable);
}

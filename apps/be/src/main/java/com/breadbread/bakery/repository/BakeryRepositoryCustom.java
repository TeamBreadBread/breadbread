package com.breadbread.bakery.repository;

import com.breadbread.bakery.dto.BakerySearch;
import com.breadbread.bakery.entity.Bakery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BakeryRepositoryCustom {
    Page<Bakery> search(BakerySearch bakerySearch, Pageable pageable);
}

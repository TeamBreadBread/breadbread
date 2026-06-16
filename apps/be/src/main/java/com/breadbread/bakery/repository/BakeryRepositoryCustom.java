package com.breadbread.bakery.repository;

import com.breadbread.bakery.dto.request.BakeryAdminSearch;
import com.breadbread.bakery.dto.request.BakeryAiSearch;
import com.breadbread.bakery.dto.request.BakerySearch;
import com.breadbread.bakery.entity.Bakery;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface BakeryRepositoryCustom {
    Page<Bakery> search(BakerySearch bakerySearch, Pageable pageable);

    List<Bakery> searchForAi(BakeryAiSearch search);

    Page<Bakery> searchAdmin(BakeryAdminSearch search, Pageable pageable);
}

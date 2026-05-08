package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryImage;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BakeryImageRepository extends JpaRepository<BakeryImage, Long> {
    void deleteAllByBakery(Bakery bakery);

    List<BakeryImage> findAllByBakeryIdInAndDisplayOrder(
            Collection<Long> bakeryIds, int displayOrder);

    List<BakeryImage> findAllByBakeryIdInOrderByDisplayOrderAsc(Collection<Long> bakeryIds);
}

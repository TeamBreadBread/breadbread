package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Menu;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MenuRepository extends JpaRepository<Menu, Long> {
}

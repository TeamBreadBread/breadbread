package com.breadbread.bakery.repository;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BakeryRepository extends JpaRepository<Bakery, Long>, BakeryRepositoryCustom {
    Optional<Bakery> findByIdAndActiveTrue(Long id);

    Optional<Bakery> findByIdAndActiveTrueAndStatus(Long id, BakeryStatus status);

    List<Bakery> findAllByIdInAndActiveTrueAndStatus(List<Long> ids, BakeryStatus status);

    List<Bakery> findAllByActiveTrueAndStatus(BakeryStatus status);

    List<Bakery> findAllByActiveFalseAndStatus(BakeryStatus status);

    boolean existsByIdAndActiveTrueAndStatus(Long id, BakeryStatus status);

    boolean existsByNameAndAddress(String name, String address);

    @Query(
            value =
                    """
                    SELECT * FROM bakery
                    WHERE ST_DWithin(
                          location::geography,
                          ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)::geography,
                          :radiusMeters
                      )
                    """,
            nativeQuery = true)
    List<Bakery> findAllNearby(
            @Param("latitude") double latitude,
            @Param("longitude") double longitude,
            @Param("radiusMeters") double radiusMeters);

    boolean existsByPlaceId(String placeId);

    Optional<Bakery> findFirstByNameAndActiveTrue(String name);

    Page<Bakery> findAllByActiveTrueAndStatus(BakeryStatus status, Pageable pageable);

    Page<Bakery> findAllByActiveTrue(Pageable pageable);

    Page<Bakery> findAllByActiveFalseAndStatus(BakeryStatus status, Pageable pageable);

    Page<Bakery> findAllByActiveFalse(Pageable pageable);
}

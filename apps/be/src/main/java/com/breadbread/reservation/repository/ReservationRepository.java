package com.breadbread.reservation.repository;

import com.breadbread.reservation.entity.Reservation;
import com.breadbread.reservation.entity.ReservationStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<Reservation, Long> {
    List<Reservation> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    List<Reservation> findAllByUserIdAndStatusOrderByCreatedAtDesc(
            Long userId, ReservationStatus status);

    boolean existsByUserIdAndDepartureDateAndDepartureTimeAndStatusIn(
            Long userId,
            LocalDate departureDate,
            LocalTime departureTime,
            Collection<ReservationStatus> statuses);

    boolean existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNot(
            Long userId,
            LocalDate departureDate,
            LocalTime departureTime,
            Collection<ReservationStatus> statuses,
            Long id);

    @Query(
            "SELECT DISTINCT r FROM Reservation r "
                    + "JOIN FETCH r.course c "
                    + "JOIN FETCH c.courseBakeries cb "
                    + "JOIN FETCH cb.bakery "
                    + "WHERE r.id = :id")
    Optional<Reservation> findWithCourseById(@Param("id") Long id);
}

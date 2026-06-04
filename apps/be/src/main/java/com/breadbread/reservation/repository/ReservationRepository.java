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

    List<Reservation> findAllByUserIdAndActiveOrderByCreatedAtDesc(Long userId, boolean active);

    List<Reservation> findAllByUserIdAndStatusAndActiveOrderByCreatedAtDesc(
            Long userId, ReservationStatus status, boolean active);

    boolean existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndActiveTrue(
            Long userId,
            LocalDate departureDate,
            LocalTime departureTime,
            Collection<ReservationStatus> statuses);

    boolean existsByUserIdAndDepartureDateAndDepartureTimeAndStatusInAndIdNotAndActiveTrue(
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
                    + "WHERE r.id = :id AND r.active = true")
    Optional<Reservation> findWithCourseById(@Param("id") Long id);

    @Query(
            "SELECT DISTINCT r FROM Reservation r "
                    + "JOIN FETCH r.user u "
                    + "JOIN FETCH r.course c "
                    + "JOIN FETCH c.courseBakeries cb "
                    + "JOIN FETCH cb.bakery "
                    + "WHERE r.departureDate = :date AND r.status = :status AND r.active = true")
    List<Reservation> findTodayConfirmedWithCourse(
            @Param("date") LocalDate date, @Param("status") ReservationStatus status);

    @Query(
            "SELECT r FROM Reservation r "
                    + "JOIN FETCH r.user "
                    + "WHERE r.departureDate < :today AND r.status IN :statuses AND r.active = true")
    List<Reservation> findExpiredByStatuses(
            @Param("today") LocalDate today,
            @Param("statuses") Collection<ReservationStatus> statuses);

    Optional<Reservation> findFirstByUserIdAndCourseIdAndDepartureDateAndStatus(
            Long userId, Long courseId, LocalDate departureDate, ReservationStatus status);

    @Query(
            "SELECT DISTINCT r.departureTime FROM Reservation r "
                    + "WHERE r.user.id = :userId AND r.departureDate = :date "
                    + "AND r.status IN :statuses AND r.active = true")
    List<LocalTime> findBookedTimesByUserAndDate(
            @Param("userId") Long userId,
            @Param("date") LocalDate date,
            @Param("statuses") Collection<ReservationStatus> statuses);
}

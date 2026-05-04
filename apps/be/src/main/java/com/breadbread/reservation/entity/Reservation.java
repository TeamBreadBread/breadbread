package com.breadbread.reservation.entity;

import com.breadbread.course.entity.Course;
import com.breadbread.global.entity.BaseEntity;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.reservation.dto.UpdateReservationRequest;
import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "reservation")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Reservation extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate departureDate;
    private LocalTime departureTime;

    private int headCount;

    private String departure;

    private Double departureLat;

    private Double departureLng;

	private Integer quotedAmount;

    @Enumerated(EnumType.STRING)
    private ReservationStatus status;

    private LocalDateTime cancelledAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

//    @ManyToOne(fetch = FetchType.LAZY)	// 추후 구현 예정
//    @JoinColumn(name = "driver_id")
//    private Driver driver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id")
    private Course course;

	private String courseNameSnapshot;

    @Builder
    public Reservation(LocalDate departureDate, LocalTime departureTime,
					   int headCount, String departure,
					   Double departureLat, Double departureLng,
					   User user, Course course) {
        this.departureDate = departureDate;
		this.departureTime = departureTime;
        this.headCount = headCount;
        this.departure = departure;
        this.departureLat = departureLat;
        this.departureLng = departureLng;
        this.status = ReservationStatus.PENDING;
        this.user = user;
        //this.driver = driver;
        this.course = course;
		this.quotedAmount = course.getEstimatedCost();
		this.courseNameSnapshot = course.getName();
    }

	public void update(UpdateReservationRequest request) {
		if (this.status == ReservationStatus.CANCELLED || this.status == ReservationStatus.COMPLETED) {
			throw new CustomException(ErrorCode.RESERVATION_NOT_MODIFIABLE);
		}
		if (request.getDepartureDate() != null) this.departureDate = request.getDepartureDate();
		if (request.getDepartureTime() != null) this.departureTime = request.getDepartureTime();
		if (request.getDeparture() != null) this.departure = request.getDeparture();
		if (request.getLat() != null) this.departureLat = request.getLat();
		if (request.getLng() != null) this.departureLng = request.getLng();
		if (request.getHeadCount() != null) this.headCount = request.getHeadCount();
	}

	public void cancel(){
		if (this.status == ReservationStatus.CANCELLED) {
			throw new CustomException(ErrorCode.RESERVATION_ALREADY_CANCELLED);
		}
		if (this.status == ReservationStatus.COMPLETED) {
			throw new CustomException(ErrorCode.RESERVATION_CANCEL_FAILED);
		}
		this.status = ReservationStatus.CANCELLED;
		this.cancelledAt = LocalDateTime.now();
	}
}

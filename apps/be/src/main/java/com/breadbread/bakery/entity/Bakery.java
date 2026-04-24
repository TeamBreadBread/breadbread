package com.breadbread.bakery.entity;

import com.breadbread.global.entity.BaseEntity;
import com.breadbread.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Bakery extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;        //• 매장 명
    private String address;     //• 매장 주소
    private String region;      // 지역구
    private Double latitude;    // 위도
    private Double longitude;   // 경도
    private String phone;       //• 문의 전화 번호
    private int rating;      //• 별점
    private String mapLink;     //• 지도 링크
    private boolean dineInAvailable;   // 매장취식여부
    private boolean parkingAvailable;  // 주차가능여부
    private String note;
    private boolean active = true;

    @Embedded
    private BusinessHours businessHours;    //• 운영 시간

    @Enumerated(EnumType.STRING)
    private BakeryType bakeryType;

    private LocalTime appearanceTime;

    @Enumerated(EnumType.STRING)
    private Frequency frequency;


    @ElementCollection(targetClass = DayOfWeek.class, fetch = FetchType.LAZY)
    @CollectionTable(name = "bakery_closed_days", joinColumns = @JoinColumn(name = "bakery_id"))
    @Enumerated(EnumType.STRING)
    private Set<DayOfWeek> closedDays = new HashSet<>();

    @ElementCollection
    @CollectionTable(name = "bakery_crowded_days", joinColumns = @JoinColumn(name = "bakery_id"))
    @Enumerated(EnumType.STRING)
    private Set<DayOfWeek> crowdedDays = new HashSet<>();

    @ElementCollection(targetClass = BakeryUseType.class, fetch = FetchType.LAZY)
    @CollectionTable(name = "bakery_use_types", joinColumns = @JoinColumn(name = "bakery_id"))
    @Enumerated(EnumType.STRING)
    private List<BakeryUseType> bakeryUseTypes = new ArrayList<>();

    @ElementCollection(targetClass = BakeryPersonality.class, fetch = FetchType.LAZY)
    @CollectionTable(name = "bakery_personalities", joinColumns = @JoinColumn(name = "bakery_id"))
    @Enumerated(EnumType.STRING)
    private List<BakeryPersonality> bakeryPersonalities = new ArrayList<>();

    @OneToMany(mappedBy = "bakery", fetch = FetchType.LAZY)
    private List<Menu> menus = new ArrayList<>();

    @OneToMany(mappedBy = "bakery", fetch = FetchType.LAZY)
    private List<BakeryImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "bakery", fetch = FetchType.LAZY)
    private List<Review> reviews = new ArrayList<>();

    @OneToOne
    private User owner;

    public void assignOwner(User user) {
        this.owner = user;
    }

    public void update(String name, String address, String region,
                       Double latitude, Double longitude,
                       String phone, String mapLink, String note,
                       List<BakeryUseType> bakeryUseTypes,
                       List<BakeryPersonality> bakeryPersonalities,
                       Set<DayOfWeek> closedDays, Set<DayOfWeek> crowdedDays,
                       Boolean dineInAvailable, Boolean parkingAvailable,
                       LocalTime weekdayOpen, LocalTime weekdayClose,
                       LocalTime weekendOpen, LocalTime weekendClose,
                       LocalTime lastOrderTime, Boolean holidayClosed,
                       LocalTime appearanceTime, Frequency frequency) {
        if (name != null) this.name = name;
        if (address != null) this.address = address;
        if (region != null) this.region = region;
        if (latitude != null) this.latitude = latitude;
        if (longitude != null) this.longitude = longitude;
        if (phone != null) this.phone = phone;
        if (mapLink != null) this.mapLink = mapLink;
        if (note != null) this.note = note;
        if (bakeryUseTypes != null) this.bakeryUseTypes = bakeryUseTypes;
        if (bakeryPersonalities != null) this.bakeryPersonalities = bakeryPersonalities;
        if (closedDays != null) this.closedDays = closedDays;
        if (crowdedDays != null) this.crowdedDays = crowdedDays;
        if (dineInAvailable != null) this.dineInAvailable = dineInAvailable;
        if (parkingAvailable != null) this.parkingAvailable = parkingAvailable;
        if (weekdayOpen != null || weekdayClose != null || weekendOpen != null
                || weekendClose != null || lastOrderTime != null || holidayClosed != null) {
            BusinessHours current = this.businessHours != null ? this.businessHours : new BusinessHours();
            this.businessHours = BusinessHours.builder()
                    .weekdayOpen(weekdayOpen != null ? weekdayOpen : current.getWeekdayOpen())
                    .weekdayClose(weekdayClose != null ? weekdayClose : current.getWeekdayClose())
                    .weekendOpen(weekendOpen != null ? weekendOpen : current.getWeekendOpen())
                    .weekendClose(weekendClose != null ? weekendClose : current.getWeekendClose())
                    .lastOrderTime(lastOrderTime != null ? lastOrderTime : current.getLastOrderTime())
                    .holidayClosed(holidayClosed != null ? holidayClosed : current.isHolidayClosed())
                    .build();
        }
        if (appearanceTime != null) this.appearanceTime = appearanceTime;
        if (frequency != null) this.frequency = frequency;
    }

    @Builder
    public Bakery(String name, BakeryType bakeryType, String address, String region,
                  Double latitude, Double longitude,
                  Set<DayOfWeek> closedDays, Set<DayOfWeek> crowdedDays,
                  LocalTime weekdayOpen, LocalTime weekdayClose,
                  LocalTime weekendOpen, LocalTime weekendClose,
                  LocalTime lastOrderTime, boolean holidayClosed,
                  String phone, int rating, String mapLink,
                  List<BakeryUseType> bakeryUseTypes,
                  List<BakeryPersonality> bakeryPersonalities,
                  boolean dineInAvailable, boolean parkingAvailable, String note,
                  LocalTime appearanceTime, Frequency frequency) {
        this.name = name;
        this.bakeryType = bakeryType;
        this.address = address;
        this.region = region;
        this.latitude = latitude;
        this.longitude = longitude;
        this.businessHours = BusinessHours.builder()
                .weekdayOpen(weekdayOpen)
                .weekdayClose(weekdayClose)
                .weekendOpen(weekendOpen)
                .weekendClose(weekendClose)
                .lastOrderTime(lastOrderTime)
                .holidayClosed(holidayClosed)
                .build();
        this.closedDays = closedDays != null ? closedDays : new HashSet<>();
        this.crowdedDays = crowdedDays != null ? crowdedDays : new HashSet<>();
        this.phone = phone;
        this.rating = rating;
        this.mapLink = mapLink;
        this.dineInAvailable = dineInAvailable;
        this.parkingAvailable = parkingAvailable;
        this.note = note;
        this.bakeryUseTypes = bakeryUseTypes != null ? bakeryUseTypes : new ArrayList<>();
        this.bakeryPersonalities = bakeryPersonalities != null ? bakeryPersonalities : new ArrayList<>();
        this.appearanceTime = appearanceTime;
        this.frequency = frequency;
    }
}
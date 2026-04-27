package com.breadbread.bakery.entity;

import com.breadbread.bakery.dto.UpdateBakeryRequest;
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
    private Integer rating;      //• 별점 (null 허용 위해 Integer로 저장)
    private String mapLink;     //• 지도 링크
    private boolean dineInAvailable;   // 매장취식여부
    private boolean parkingAvailable;  // 주차가능여부
    private boolean drinkAvailable;     // 음료 판매 여부
    private String note;
    private boolean active = true;

    @Embedded
    private BusinessHours businessHours;    //• 운영 시간

    private LocalTime appearanceTime;

    @Enumerated(EnumType.STRING)
    private Frequency frequency;

    @Enumerated(EnumType.STRING)
    private BakeryType bakeryType;


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
    private List<Bread> breads = new ArrayList<>();

    @OneToMany(mappedBy = "bakery", fetch = FetchType.LAZY)
    private List<BakeryImage> images = new ArrayList<>();

    @OneToMany(mappedBy = "bakery", fetch = FetchType.LAZY)
    private List<Review> reviews = new ArrayList<>();

    @OneToOne
    private User owner;

    public void assignOwner(User user) {
        this.owner = user;
    }

    public void update(UpdateBakeryRequest req) {
        if (req.getName() != null) this.name = req.getName();
        if (req.getAddress() != null) this.address = req.getAddress();
        if (req.getRegion() != null) this.region = req.getRegion();
        if (req.getLatitude() != null) this.latitude = req.getLatitude();
        if (req.getLongitude() != null) this.longitude = req.getLongitude();
        if (req.getPhone() != null) this.phone = req.getPhone();
        if (req.getMapLink() != null) this.mapLink = req.getMapLink();
        if (req.getNote() != null) this.note = req.getNote();
        if (req.getBakeryType() != null) this.bakeryType = req.getBakeryType();
        if (req.getBakeryUseTypes() != null) this.bakeryUseTypes = req.getBakeryUseTypes();
        if (req.getBakeryPersonalities() != null) this.bakeryPersonalities = req.getBakeryPersonalities();
        if (req.getClosedDays() != null) this.closedDays = req.getClosedDays();
        if (req.getCrowdedDays() != null) this.crowdedDays = req.getCrowdedDays();
        if (req.getDineInAvailable() != null) this.dineInAvailable = req.getDineInAvailable();
        if (req.getParkingAvailable() != null) this.parkingAvailable = req.getParkingAvailable();
        if (req.getDrinkAvailable() != null) this.drinkAvailable = req.getDrinkAvailable();
        if (req.getAppearanceTime() != null) this.appearanceTime = req.getAppearanceTime();
        if (req.getFrequency() != null) this.frequency = req.getFrequency();
        if (req.getWeekdayOpen() != null || req.getWeekdayClose() != null
                || req.getWeekendOpen() != null || req.getWeekendClose() != null
                || req.getLastOrderTime() != null || req.getHolidayClosed() != null) {
            BusinessHours current = this.businessHours != null ? this.businessHours : new BusinessHours();
            this.businessHours = BusinessHours.builder()
                    .weekdayOpen(req.getWeekdayOpen() != null ? req.getWeekdayOpen() : current.getWeekdayOpen())
                    .weekdayClose(req.getWeekdayClose() != null ? req.getWeekdayClose() : current.getWeekdayClose())
                    .weekendOpen(req.getWeekendOpen() != null ? req.getWeekendOpen() : current.getWeekendOpen())
                    .weekendClose(req.getWeekendClose() != null ? req.getWeekendClose() : current.getWeekendClose())
                    .lastOrderTime(req.getLastOrderTime() != null ? req.getLastOrderTime() : current.getLastOrderTime())
                    .holidayClosed(req.getHolidayClosed() != null ? req.getHolidayClosed() : current.isHolidayClosed())
                    .build();
        }
    }

    @Builder
    public Bakery(String name, String address, String region,
                  Double latitude, Double longitude,
                  Set<DayOfWeek> closedDays, Set<DayOfWeek> crowdedDays,
                  LocalTime weekdayOpen, LocalTime weekdayClose,
                  LocalTime weekendOpen, LocalTime weekendClose,
                  String lastOrderTime, boolean holidayClosed,
                  String phone, Integer rating, String mapLink,
                  BakeryType bakeryType,
                  List<BakeryUseType> bakeryUseTypes,
                  List<BakeryPersonality> bakeryPersonalities,
                  boolean dineInAvailable, boolean parkingAvailable,
                  boolean drinkAvailable, String note,
                  LocalTime appearanceTime, Frequency frequency) {
        this.name = name;
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
        this.drinkAvailable = drinkAvailable;
        this.note = note;
        this.bakeryType = bakeryType;
        this.bakeryUseTypes = bakeryUseTypes != null ? bakeryUseTypes : new ArrayList<>();
        this.bakeryPersonalities = bakeryPersonalities != null ? bakeryPersonalities : new ArrayList<>();
        this.appearanceTime = appearanceTime;
        this.frequency = frequency;
    }
}
package com.breadbread.bakery.entity;

import com.breadbread.global.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalTime;
import lombok.*;

@Entity
@Table(name = "crowd_time")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@ToString(exclude = "bakery")
public class CrowdTime extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bakery_id")
    private Bakery bakery;

    @Enumerated(EnumType.STRING)
    private DayType dayType;

    // private int hour;
    private LocalTime peakStart;
    private LocalTime peakEnd;

    @Enumerated(EnumType.STRING)
    private CrowdLevel crowdLevel;

    private Integer expectedWaitMin;

    private String sourceType;

    @Builder
    private CrowdTime(
            DayType dayType,
            CrowdLevel crowdLevel,
            LocalTime peakStart,
            LocalTime peakEnd,
            Integer expectedWaitMin,
            String sourceType,
            Bakery bakery) {
        this.dayType = dayType;
        // this.hour = hour;
        this.crowdLevel = crowdLevel;
        this.peakStart = peakStart;
        this.peakEnd = peakEnd;
        this.expectedWaitMin = expectedWaitMin;
        this.sourceType = sourceType;
        this.bakery = bakery;
    }
}

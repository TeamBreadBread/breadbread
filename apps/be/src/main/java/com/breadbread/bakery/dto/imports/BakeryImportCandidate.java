package com.breadbread.bakery.dto.imports;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class BakeryImportCandidate {
    private String externalId;
    private String name;
    private String address;
    private String region;
    private String dong;
    private double latitude;
    private double longitude;
    private String phone;
    private String mapLink;
    private LocalTime weekdayOpen;
    private LocalTime weekdayClose;
    private LocalTime weekendOpen;
    private LocalTime weekendClose;
    private Set<DayOfWeek> closedDays;
}

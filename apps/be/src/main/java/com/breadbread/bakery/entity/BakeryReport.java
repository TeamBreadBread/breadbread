package com.breadbread.bakery.entity;

import com.breadbread.bakery.entity.enums.BakeryReportType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryUpdateField;
import com.breadbread.global.entity.BaseEntity;
import com.breadbread.user.entity.User;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bakery_report")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class BakeryReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BakeryReportType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BakeryStatus status = BakeryStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    // NEW_BAKERY 필드
    private String bakeryName;
    private String address;
    private String district;

    @ElementCollection
    @CollectionTable(
            name = "bakery_report_representative_menus",
            joinColumns = @JoinColumn(name = "bakery_report_id"))
    @Column(name = "menu")
    private List<String> representativeMenus = new ArrayList<>();

    private String recommendation;

    // UPDATE_BAKERY 필드
    private String targetBakeryName;

    // MENU_SUGGESTION 필드
    private Long targetBakeryId;
    private String menuName;
    private String menuDescription;

    @Enumerated(EnumType.STRING)
    private BakeryUpdateField updateField;

    @Column(length = 500)
    private String correctValue;

    @Column(length = 500)
    private String description;

    @Builder
    public BakeryReport(
            BakeryReportType type,
            User user,
            String bakeryName,
            String address,
            String district,
            List<String> representativeMenus,
            String recommendation,
            String targetBakeryName,
            BakeryUpdateField updateField,
            String correctValue,
            String description,
            Long targetBakeryId,
            String menuName,
            String menuDescription) {
        this.type = type;
        this.user = user;
        this.bakeryName = bakeryName;
        this.address = address;
        this.district = district;
        if (representativeMenus != null) this.representativeMenus = representativeMenus;
        this.recommendation = recommendation;
        this.targetBakeryName = targetBakeryName;
        this.updateField = updateField;
        this.correctValue = correctValue;
        this.description = description;
        this.targetBakeryId = targetBakeryId;
        this.menuName = menuName;
        this.menuDescription = menuDescription;
    }

    public void approve() {
        this.status = BakeryStatus.APPROVED;
    }

    public void reject() {
        this.status = BakeryStatus.REJECTED;
    }
}

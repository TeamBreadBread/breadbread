package com.breadbread.course.entity;

import com.breadbread.bakery.entity.BreadType;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Embeddable
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ManualCourseInfo {
    private boolean editorPick;

    @Enumerated(EnumType.STRING)
    private BreadType breadType;

    @Builder
    public ManualCourseInfo(boolean editorPick, BreadType breadType) {
        this.editorPick = editorPick;
        this.breadType = breadType;
    }
}

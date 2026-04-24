package com.breadbread.user.entity;

public enum UserGrade {
    MORNING_BREAD(0,  "모닝빵", "빵빵에 갓 도착한 작고 소중한 신입"),
    CREAM_BREAD  (3,  "크림빵", "크림이 채워지듯 재미를 알아가는 유저"),
    SALT_BREAD   (10, "소금빵", "빵빵의 매력을 제대로 아는 숙련 유저"),
    GOLDEN_CHOUX (30, "황금슈", "빵빵의 빛나는 황금 유저");

    private final int requiredCount;  // 등급 달성 기준 횟수
    private final String displayName; // 등급명
    private final String description; // 설명

    UserGrade(int requiredCount, String displayName, String description) {
        this.requiredCount = requiredCount;
        this.displayName = displayName;
        this.description = description;
    }

    public int getRequiredCount() { return requiredCount; }
    public String getDisplayName() { return displayName; }
    public String getDescription() { return description; }

}

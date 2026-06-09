package com.breadbread.global.dto;

public enum UploadFolder {
    bakeries,
    breads,
    reviews,
    posts,
    profiles,
    courses;

    public String path() {
        return this.name();
    }
}

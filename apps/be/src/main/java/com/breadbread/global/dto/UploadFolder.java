package com.breadbread.global.dto;

public enum UploadFolder {
    bakeries,
    breads,
    reviews,
    profiles;

    public String path() {
        return this.name();
    }
}

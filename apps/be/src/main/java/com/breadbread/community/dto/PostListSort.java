package com.breadbread.community.dto;

/** 게시글 목록 정렬 (API `sort` 쿼리 파라미터) */
public enum PostListSort {
    LATEST,
    LIKE_COUNT;

    public static PostListSort fromParam(String raw) {
        if (raw == null || raw.isBlank()) {
            return LATEST;
        }
        try {
            return PostListSort.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return LATEST;
        }
    }
}

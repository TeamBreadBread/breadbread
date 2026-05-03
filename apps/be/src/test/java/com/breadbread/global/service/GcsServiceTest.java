package com.breadbread.global.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class GcsServiceTest {

    @Test
    void sanitizeClientFilename_keepsBasenameOnly() {
        assertThat(GcsService.sanitizeClientFilename("photo.png")).isEqualTo("photo.png");
        assertThat(GcsService.sanitizeClientFilename("folder/photo.png")).isEqualTo("photo.png");
        assertThat(GcsService.sanitizeClientFilename("folder\\photo.png")).isEqualTo("photo.png");
    }

    @Test
    void sanitizeClientFilename_rejectsPathTraversal() {
        assertThat(GcsService.sanitizeClientFilename("../evil.png")).isEmpty();
        assertThat(GcsService.sanitizeClientFilename("a/../evil.png")).isEmpty();
        assertThat(GcsService.sanitizeClientFilename("evil/../x.png")).isEmpty();
    }

    @Test
    void sanitizeClientFilename_rejectsEmbeddedSeparators() {
        assertThat(GcsService.sanitizeClientFilename("a/b.png")).isEmpty();
    }
}

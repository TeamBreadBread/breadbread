package com.breadbread.global.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.junit.jupiter.api.Test;

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
    void sanitizeClientFilename_allowsDoubleDotInsideBasename() {
        assertThat(GcsService.sanitizeClientFilename("photo..png")).isEqualTo("photo..png");
    }

    @Test
    void sanitizeClientFilename_nestedPath_returnsLastSegment() {
        assertThat(GcsService.sanitizeClientFilename("a/b.png")).isEqualTo("b.png");
    }

    @Test
    void safeExtensionForImageType_mapsMimeTypes() {
        assertThat(GcsService.safeExtensionForImageType("image/jpeg")).isEqualTo(".jpg");
        assertThat(GcsService.safeExtensionForImageType("image/jpg")).isEqualTo(".jpg");
        assertThat(GcsService.safeExtensionForImageType("image/png")).isEqualTo(".png");
        assertThat(GcsService.safeExtensionForImageType("image/webp")).isEqualTo(".webp");
    }

    @Test
    void safeExtensionForImageType_unknownThrows() {
        assertThatThrownBy(() -> GcsService.safeExtensionForImageType("image/gif"))
                .isInstanceOf(IllegalStateException.class);
    }

    @Test
    void isAllowedObjectKey_acceptsGeneratedUploadKeys() {
        String id = UUID.randomUUID().toString();
        assertThat(GcsService.isAllowedObjectKey("reviews/" + id + ".jpg")).isTrue();
        assertThat(GcsService.isAllowedObjectKey("bakeries/" + id + ".png")).isTrue();
        assertThat(GcsService.isAllowedObjectKey("reviews/" + id + ".exe")).isFalse();
        assertThat(GcsService.isAllowedObjectKey("other/" + id + ".jpg")).isFalse();
        assertThat(GcsService.isAllowedObjectKey("reviews/../" + id + ".jpg")).isFalse();
    }
}

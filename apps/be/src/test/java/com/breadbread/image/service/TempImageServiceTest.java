package com.breadbread.image.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.image.entity.TempImage;
import com.breadbread.image.repository.TempImageRepository;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class TempImageServiceTest {

    @Mock private TempImageRepository tempImageRepository;
    @Mock private UserRepository userRepository;
    @Mock private GcsService gcsService;

    @InjectMocks private TempImageService tempImageService;

    // ─── saveAll ─────────────────────────────────────────────────────────────

    @Test
    void saveAll_does_nothing_when_urls_empty() {
        tempImageService.saveAll(1L, List.of(), UploadFolder.posts);

        verify(userRepository, never()).findById(any());
        verify(tempImageRepository, never()).saveAll(anyList());
    }

    @Test
    void saveAll_throws_when_user_not_found() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                tempImageService.saveAll(
                                        99L,
                                        List.of(
                                                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png"),
                                        UploadFolder.posts))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void saveAll_persists_temp_images_for_each_url() {
        User user = user(1L);
        List<String> urls =
                List.of(
                        "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png",
                        "https://storage.googleapis.com/bucket/posts/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png");
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(gcsService.extractObjectKey(urls.get(0)))
                .thenReturn("posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png");
        when(gcsService.extractObjectKey(urls.get(1)))
                .thenReturn("posts/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png");

        tempImageService.saveAll(1L, urls, UploadFolder.posts);

        verify(tempImageRepository).saveAll(anyList());
    }

    // ─── consumeOwnedImages ──────────────────────────────────────────────────

    @Test
    void consumeOwnedImages_does_nothing_when_urls_empty() {
        tempImageService.consumeOwnedImages(1L, List.of(), UploadFolder.posts);

        verify(tempImageRepository, never()).findAllByUrlIn(anyList());
    }

    @Test
    void consumeOwnedImages_throws_when_url_not_in_temp_table() {
        String url =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        when(tempImageRepository.findAllByUrlIn(anyCollection())).thenReturn(List.of());

        assertThatThrownBy(
                        () ->
                                tempImageService.consumeOwnedImages(
                                        1L, List.of(url), UploadFolder.posts))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TEMP_IMAGE_NOT_FOUND);
    }

    @Test
    void consumeOwnedImages_throws_when_owner_mismatch() {
        String url =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        TempImage tempImage = tempImage(url, user(2L), UploadFolder.posts);
        when(tempImageRepository.findAllByUrlIn(anyCollection())).thenReturn(List.of(tempImage));

        assertThatThrownBy(
                        () ->
                                tempImageService.consumeOwnedImages(
                                        1L, List.of(url), UploadFolder.posts))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void consumeOwnedImages_throws_when_domain_mismatch() {
        String url =
                "https://storage.googleapis.com/bucket/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg";
        TempImage tempImage = tempImage(url, user(1L), UploadFolder.reviews);
        when(tempImageRepository.findAllByUrlIn(anyCollection())).thenReturn(List.of(tempImage));

        assertThatThrownBy(
                        () ->
                                tempImageService.consumeOwnedImages(
                                        1L, List.of(url), UploadFolder.posts))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void consumeOwnedImages_deletes_when_owner_and_domain_match() {
        String url =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        TempImage tempImage = tempImage(url, user(1L), UploadFolder.posts);
        when(tempImageRepository.findAllByUrlIn(anyCollection())).thenReturn(List.of(tempImage));

        tempImageService.consumeOwnedImages(1L, List.of(url), UploadFolder.posts);

        verify(tempImageRepository).deleteAll(List.of(tempImage));
    }

    // ─── deleteOwnedImage ────────────────────────────────────────────────────

    @Test
    void deleteOwnedImage_throws_when_temp_image_not_found() {
        String url =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        when(tempImageRepository.findByUrl(url)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> tempImageService.deleteOwnedImage(1L, UserRole.ROLE_USER, url))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.TEMP_IMAGE_NOT_FOUND);
    }

    @Test
    void deleteOwnedImage_throws_when_not_owner_and_not_admin() {
        String url =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        TempImage tempImage = tempImage(url, user(2L), UploadFolder.posts);
        when(tempImageRepository.findByUrl(url)).thenReturn(Optional.of(tempImage));

        assertThatThrownBy(() -> tempImageService.deleteOwnedImage(1L, UserRole.ROLE_USER, url))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);
    }

    @Test
    void deleteOwnedImage_succeeds_when_owner() {
        String url =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        TempImage tempImage = tempImage(url, user(1L), UploadFolder.posts);
        when(tempImageRepository.findByUrl(url)).thenReturn(Optional.of(tempImage));

        tempImageService.deleteOwnedImage(1L, UserRole.ROLE_USER, url);

        verify(gcsService).deleteByObjectKey(tempImage.getObjectKey());
        verify(tempImageRepository).delete(tempImage);
    }

    @Test
    void deleteOwnedImage_succeeds_when_admin_deletes_others_image() {
        String url =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        TempImage tempImage = tempImage(url, user(2L), UploadFolder.posts);
        when(tempImageRepository.findByUrl(url)).thenReturn(Optional.of(tempImage));

        tempImageService.deleteOwnedImage(1L, UserRole.ROLE_ADMIN, url);

        verify(gcsService).deleteByObjectKey(tempImage.getObjectKey());
        verify(tempImageRepository).delete(tempImage);
    }

    // ─── cleanupExpiredImages ────────────────────────────────────────────────

    @Test
    void cleanupExpiredImages_does_nothing_when_no_expired_images() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        when(tempImageRepository.findAllByUploadedAtBefore(threshold)).thenReturn(List.of());

        tempImageService.cleanupExpiredImages(threshold);

        verify(gcsService, never()).deleteByObjectKey(any());
        verify(tempImageRepository, never()).delete(any());
    }

    @Test
    void cleanupExpiredImages_deletes_all_expired() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        String url1 =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        String url2 =
                "https://storage.googleapis.com/bucket/posts/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png";
        TempImage t1 =
                tempImage(
                        url1,
                        user(1L),
                        UploadFolder.posts,
                        "posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png");
        TempImage t2 =
                tempImage(
                        url2,
                        user(2L),
                        UploadFolder.posts,
                        "posts/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png");
        when(tempImageRepository.findAllByUploadedAtBefore(threshold)).thenReturn(List.of(t1, t2));

        tempImageService.cleanupExpiredImages(threshold);

        verify(gcsService, times(2)).deleteByObjectKey(any());
        verify(tempImageRepository).delete(t1);
        verify(tempImageRepository).delete(t2);
    }

    @Test
    void cleanupExpiredImages_continues_when_one_gcs_delete_fails() {
        LocalDateTime threshold = LocalDateTime.now().minusHours(24);
        String url1 =
                "https://storage.googleapis.com/bucket/posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png";
        String url2 =
                "https://storage.googleapis.com/bucket/posts/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png";
        TempImage t1 =
                tempImage(
                        url1,
                        user(1L),
                        UploadFolder.posts,
                        "posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png");
        TempImage t2 =
                tempImage(
                        url2,
                        user(2L),
                        UploadFolder.posts,
                        "posts/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png");
        when(tempImageRepository.findAllByUploadedAtBefore(threshold)).thenReturn(List.of(t1, t2));
        org.mockito.Mockito.doThrow(new CustomException(ErrorCode.FILE_DELETE_FAILED))
                .when(gcsService)
                .deleteByObjectKey("posts/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png");

        tempImageService.cleanupExpiredImages(threshold);

        verify(tempImageRepository, never()).delete(t1);
        verify(tempImageRepository).delete(t2);
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private User user(Long id) {
        User user =
                User.builder()
                        .loginId("user" + id)
                        .password("pw")
                        .name("name" + id)
                        .nickname("nick" + id)
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private TempImage tempImage(String url, User owner, UploadFolder domain) {
        return tempImage(
                url, owner, domain, domain.path() + "/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.png");
    }

    private TempImage tempImage(String url, User owner, UploadFolder domain, String objectKey) {
        return TempImage.builder().url(url).objectKey(objectKey).domain(domain).user(owner).build();
    }
}

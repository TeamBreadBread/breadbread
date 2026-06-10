package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.dto.CreateBreadRequest;
import com.breadbread.bakery.dto.UpdateBreadRequest;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.BreadType;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.global.dto.UploadFolder;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.image.service.GcsService;
import com.breadbread.image.service.TempImageService;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BreadServiceTest {

    @Mock private BakeryRepository bakeryRepository;
    @Mock private BreadRepository breadRepository;
    @Mock private GcsService gcsService;
    @Mock private TempImageService tempImageService;

    @InjectMocks private BreadService breadService;

    @Test
    void createBread_throws_whenForbidden() {
        Bakery bakery = bakeryWithId(1L);
        bakery.assignOwner(user(1L, UserRole.ROLE_BUSINESS));
        when(bakeryRepository.findByIdAndActiveTrue(1L)).thenReturn(Optional.of(bakery));
        CreateBreadRequest request = createBreadRequest("메론빵");

        assertThatThrownBy(() -> breadService.createBread(2L, UserRole.ROLE_BUSINESS, 1L, request))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.FORBIDDEN);

        verify(breadRepository, never()).save(any());
    }

    @Test
    void createBread_returnsBreadId_whenOwner() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        CreateBreadRequest request = createBreadRequest("소금빵");
        when(bakeryRepository.findByIdAndActiveTrue(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.save(any(Bread.class)))
                .thenAnswer(
                        inv -> {
                            Bread saved = inv.getArgument(0);
                            ReflectionTestUtils.setField(saved, "id", 400L);
                            return saved;
                        });

        Long breadId = breadService.createBread(7L, UserRole.ROLE_BUSINESS, 4L, request);

        assertThat(breadId).isEqualTo(400L);
    }

    @Test
    void updateBread_deletesOldImage_whenUrlChanges() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        Bread bread =
                Bread.builder()
                        .name("old")
                        .price(1000)
                        .imageUrl("prev.jpg")
                        .bakery(bakery)
                        .breadType(BreadType.BREAD)
                        .signature(false)
                        .selloutMin(0)
                        .build();
        ReflectionTestUtils.setField(bread, "id", 50L);
        UpdateBreadRequest request = new UpdateBreadRequest();
        ReflectionTestUtils.setField(request, "imageUrl", "next.jpg");
        when(bakeryRepository.findByIdAndActiveTrue(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findByIdAndBakeryId(50L, 4L)).thenReturn(Optional.of(bread));

        breadService.updateBread(7L, UserRole.ROLE_BUSINESS, 4L, 50L, request);

        verify(tempImageService).consumeOwnedImages(7L, List.of("next.jpg"), UploadFolder.breads);
        verify(gcsService).deleteQuietly("prev.jpg");
    }

    @Test
    void updateBread_throws_whenBreadMissing() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        when(bakeryRepository.findByIdAndActiveTrue(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findByIdAndBakeryId(999L, 4L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                breadService.updateBread(
                                        7L,
                                        UserRole.ROLE_BUSINESS,
                                        4L,
                                        999L,
                                        new UpdateBreadRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MENU_NOT_FOUND);
    }

    @Test
    void updateBread_throws_whenBreadBelongsToDifferentBakery() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        when(bakeryRepository.findByIdAndActiveTrue(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findByIdAndBakeryId(50L, 4L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                breadService.updateBread(
                                        7L,
                                        UserRole.ROLE_BUSINESS,
                                        4L,
                                        50L,
                                        new UpdateBreadRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.MENU_NOT_FOUND);

        verify(gcsService, never()).deleteQuietly(any());
    }

    @Test
    void deleteBread_deletesImage_whenPresent() {
        Bakery bakery = bakeryWithId(4L);
        bakery.assignOwner(user(7L, UserRole.ROLE_BUSINESS));
        Bread bread =
                Bread.builder()
                        .name("x")
                        .price(500)
                        .imageUrl("gone.jpg")
                        .bakery(bakery)
                        .breadType(BreadType.BREAD)
                        .signature(false)
                        .selloutMin(0)
                        .build();
        ReflectionTestUtils.setField(bread, "id", 60L);
        when(bakeryRepository.findByIdAndActiveTrue(4L)).thenReturn(Optional.of(bakery));
        when(breadRepository.findByIdAndBakeryId(60L, 4L)).thenReturn(Optional.of(bread));

        breadService.deleteBread(7L, UserRole.ROLE_BUSINESS, 4L, 60L);

        verify(gcsService).deleteQuietly("gone.jpg");
        verify(breadRepository).delete(bread);
    }

    private static Bakery bakeryWithId(long id) {
        Bakery b =
                Bakery.builder()
                        .name("테스트빵집")
                        .address("주소")
                        .region("대전")
                        .latitude(36.0)
                        .longitude(127.0)
                        .phone("010")
                        .rating(null)
                        .mapLink("m")
                        .dineInAvailable(true)
                        .parkingAvailable(false)
                        .drinkAvailable(true)
                        .note("")
                        .build();
        ReflectionTestUtils.setField(b, "id", id);
        return b;
    }

    private static User user(long id, UserRole role) {
        User u =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n" + id)
                        .nickname("nick" + id)
                        .email(id + "@t.com")
                        .phone("0100000" + String.format("%04d", id))
                        .role(role)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }

    private static CreateBreadRequest createBreadRequest(String name) {
        CreateBreadRequest request = new CreateBreadRequest();
        ReflectionTestUtils.setField(request, "name", name);
        ReflectionTestUtils.setField(request, "price", 2000);
        ReflectionTestUtils.setField(request, "signature", false);
        return request;
    }
}

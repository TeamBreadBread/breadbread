package com.breadbread.bakery.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.dto.request.ApproveMenuReportRequest;
import com.breadbread.bakery.dto.request.CreateMenuReportRequest;
import com.breadbread.bakery.dto.request.CreateNewBakeryReportRequest;
import com.breadbread.bakery.dto.request.CreateUpdateBakeryReportRequest;
import com.breadbread.bakery.dto.response.BakeryReportListResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryReport;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.enums.BakeryReportType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.entity.enums.BakeryUpdateField;
import com.breadbread.bakery.entity.enums.BreadType;
import com.breadbread.bakery.repository.BakeryReportRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.entity.UserRole;
import com.breadbread.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BakeryReportServiceTest {

    @Mock private BakeryReportRepository bakeryReportRepository;
    @Mock private BakeryRepository bakeryRepository;
    @Mock private BreadRepository breadRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks private BakeryReportService bakeryReportService;

    // ── submitNew ─────────────────────────────────────────────────────────────

    @Test
    void submitNew_saves_report_and_returns_id() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        BakeryReport saved = newBakeryReport(10L, BakeryStatus.PENDING);
        when(bakeryReportRepository.save(any())).thenReturn(saved);

        CreateNewBakeryReportRequest req = new CreateNewBakeryReportRequest();
        ReflectionTestUtils.setField(req, "bakeryName", "테스트 빵집");
        ReflectionTestUtils.setField(req, "address", "서울 강남구 역삼동 1-1");
        ReflectionTestUtils.setField(req, "district", "역삼동");

        Long id = bakeryReportService.submitNew(1L, req);

        assertThat(id).isEqualTo(10L);
        verify(bakeryReportRepository).save(any(BakeryReport.class));
    }

    @Test
    void submitNew_throws_USER_NOT_FOUND_when_user_missing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(
                        () ->
                                bakeryReportService.submitNew(
                                        99L, new CreateNewBakeryReportRequest()))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    // ── submitUpdate ──────────────────────────────────────────────────────────

    @Test
    void submitUpdate_saves_report_and_returns_id() {
        User user = user(1L);
        Bakery bakery = approvedBakeryWithId(10L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(10L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        BakeryReport saved = updateBakeryReport(20L, BakeryStatus.PENDING);
        when(bakeryReportRepository.save(any())).thenReturn(saved);

        CreateUpdateBakeryReportRequest req = new CreateUpdateBakeryReportRequest();
        ReflectionTestUtils.setField(req, "targetBakeryId", 10L);
        ReflectionTestUtils.setField(req, "updateField", BakeryUpdateField.ADDRESS);
        ReflectionTestUtils.setField(req, "correctValue", "서울 강남구 삼성동 99-1");

        Long id = bakeryReportService.submitUpdate(1L, req);

        assertThat(id).isEqualTo(20L);
    }

    @Test
    void submitUpdate_throws_BAKERY_NOT_FOUND_when_bakery_missing() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(99L, BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        CreateUpdateBakeryReportRequest req = new CreateUpdateBakeryReportRequest();
        ReflectionTestUtils.setField(req, "targetBakeryId", 99L);
        ReflectionTestUtils.setField(req, "updateField", BakeryUpdateField.ADDRESS);
        ReflectionTestUtils.setField(req, "correctValue", "주소");

        assertThatThrownBy(() -> bakeryReportService.submitUpdate(1L, req))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    // ── getReports ────────────────────────────────────────────────────────────

    @Test
    void getReports_with_status_filter_calls_findAllByStatus() {
        BakeryReport report = newBakeryReport(1L, BakeryStatus.PENDING);
        when(bakeryReportRepository.findAllByStatus(BakeryStatus.PENDING, PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of(report)));

        BakeryReportListResponse response =
                bakeryReportService.getReports(BakeryStatus.PENDING, PageRequest.of(0, 10));

        assertThat(response.getReports()).hasSize(1);
        assertThat(response.getTotal()).isEqualTo(1);
        assertThat(response.isHasNext()).isFalse();
    }

    @Test
    void getReports_without_status_calls_findAll() {
        when(bakeryReportRepository.findAll(PageRequest.of(0, 10)))
                .thenReturn(new PageImpl<>(List.of()));

        BakeryReportListResponse response =
                bakeryReportService.getReports(null, PageRequest.of(0, 10));

        assertThat(response.getReports()).isEmpty();
        verify(bakeryReportRepository).findAll(PageRequest.of(0, 10));
        verify(bakeryReportRepository, never()).findAllByStatus(any(), any());
    }

    // ── approve (NEW_BAKERY) ──────────────────────────────────────────────────

    @Test
    void approve_NEW_BAKERY_creates_pending_bakery() {
        BakeryReport report = newBakeryReport(1L, BakeryStatus.PENDING);
        when(bakeryReportRepository.findById(1L)).thenReturn(Optional.of(report));

        bakeryReportService.approve(1L);

        ArgumentCaptor<Bakery> captor = ArgumentCaptor.forClass(Bakery.class);
        verify(bakeryReportRepository).findById(1L);
        verify(bakeryRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(BakeryStatus.PENDING);
        assertThat(report.getStatus()).isEqualTo(BakeryStatus.APPROVED);
    }

    @Test
    void approve_NEW_BAKERY_pending_bakery_has_report_name_and_address() {
        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.NEW_BAKERY)
                        .bakeryName("새 빵집")
                        .address("서울 강남구 역삼동 1-1")
                        .district("역삼동")
                        .build();
        ReflectionTestUtils.setField(report, "id", 1L);
        when(bakeryReportRepository.findById(1L)).thenReturn(Optional.of(report));

        bakeryReportService.approve(1L);

        ArgumentCaptor<Bakery> captor = ArgumentCaptor.forClass(Bakery.class);
        verify(bakeryRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("새 빵집");
        assertThat(captor.getValue().getAddress()).isEqualTo("서울 강남구 역삼동 1-1");
        assertThat(captor.getValue().getDong()).isEqualTo("역삼동");
    }

    @Test
    void approve_throws_BAKERY_REPORT_TYPE_MISMATCH_when_menu_suggestion() {
        BakeryReport report = menuReport(30L, BakeryStatus.PENDING);
        when(bakeryReportRepository.findById(30L)).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> bakeryReportService.approve(30L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_REPORT_TYPE_MISMATCH);

        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void approve_throws_BAKERY_REPORT_ALREADY_PROCESSED_when_not_pending() {
        BakeryReport report = newBakeryReport(1L, BakeryStatus.APPROVED);
        when(bakeryReportRepository.findById(1L)).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> bakeryReportService.approve(1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_REPORT_ALREADY_PROCESSED);

        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void approve_throws_BAKERY_REPORT_NOT_FOUND_when_report_missing() {
        when(bakeryReportRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryReportService.approve(99L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_REPORT_NOT_FOUND);
    }

    // ── approve (UPDATE_BAKERY) ───────────────────────────────────────────────

    @Test
    void approve_UPDATE_BAKERY_ADDRESS_updates_bakery_address() {
        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.UPDATE_BAKERY)
                        .targetBakeryId(10L)
                        .updateField(BakeryUpdateField.ADDRESS)
                        .correctValue("서울 강남구 삼성동 99-1")
                        .build();
        ReflectionTestUtils.setField(report, "id", 2L);

        Bakery bakery = approvedBakeryWithId(10L);
        when(bakeryReportRepository.findById(2L)).thenReturn(Optional.of(report));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(10L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        bakeryReportService.approve(2L);

        assertThat(bakery.getAddress()).isEqualTo("서울 강남구 삼성동 99-1");
        assertThat(report.getStatus()).isEqualTo(BakeryStatus.APPROVED);
    }

    @Test
    void approve_UPDATE_BAKERY_DISTRICT_updates_bakery_dong() {
        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.UPDATE_BAKERY)
                        .targetBakeryId(10L)
                        .updateField(BakeryUpdateField.DISTRICT)
                        .correctValue("삼성동")
                        .build();
        ReflectionTestUtils.setField(report, "id", 3L);

        Bakery bakery = approvedBakeryWithId(10L);
        when(bakeryReportRepository.findById(3L)).thenReturn(Optional.of(report));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(10L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        bakeryReportService.approve(3L);

        assertThat(bakery.getDong()).isEqualTo("삼성동");
    }

    @Test
    void approve_UPDATE_BAKERY_throws_BAKERY_NOT_FOUND_when_target_missing() {
        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.UPDATE_BAKERY)
                        .targetBakeryId(99L)
                        .updateField(BakeryUpdateField.ADDRESS)
                        .correctValue("주소")
                        .build();
        ReflectionTestUtils.setField(report, "id", 4L);

        when(bakeryReportRepository.findById(4L)).thenReturn(Optional.of(report));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(99L, BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> bakeryReportService.approve(4L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);

        assertThat(report.getStatus()).isEqualTo(BakeryStatus.PENDING);
    }

    // ── submitMenu ────────────────────────────────────────────────────────────

    @Test
    void submitMenu_saves_report_and_returns_id() {
        User user = user(1L);
        Bakery bakery = approvedBakeryWithId(10L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(10L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        BakeryReport saved = menuReport(30L, BakeryStatus.PENDING);
        when(bakeryReportRepository.save(any())).thenReturn(saved);

        CreateMenuReportRequest req = new CreateMenuReportRequest();
        ReflectionTestUtils.setField(req, "bakeryId", 10L);
        ReflectionTestUtils.setField(req, "menuName", "소금빵");
        ReflectionTestUtils.setField(req, "description", "가격 2500원");

        Long id = bakeryReportService.submitMenu(1L, req);

        assertThat(id).isEqualTo(30L);
        verify(bakeryReportRepository).save(any(BakeryReport.class));
    }

    @Test
    void submitMenu_throws_USER_NOT_FOUND_when_user_missing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        CreateMenuReportRequest req = new CreateMenuReportRequest();
        ReflectionTestUtils.setField(req, "bakeryId", 10L);
        ReflectionTestUtils.setField(req, "menuName", "소금빵");

        assertThatThrownBy(() -> bakeryReportService.submitMenu(99L, req))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.USER_NOT_FOUND);
    }

    @Test
    void submitMenu_throws_BAKERY_NOT_FOUND_when_bakery_not_approved() {
        User user = user(1L);
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(99L, BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        CreateMenuReportRequest req = new CreateMenuReportRequest();
        ReflectionTestUtils.setField(req, "bakeryId", 99L);
        ReflectionTestUtils.setField(req, "menuName", "소금빵");

        assertThatThrownBy(() -> bakeryReportService.submitMenu(1L, req))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);
    }

    // ── approveMenu ───────────────────────────────────────────────────────────

    @Test
    void approveMenu_creates_bread_and_approves_report() {
        BakeryReport report = menuReport(30L, BakeryStatus.PENDING);
        Bakery bakery = approvedBakeryWithId(10L);
        when(bakeryReportRepository.findById(30L)).thenReturn(Optional.of(report));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(10L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        ApproveMenuReportRequest req = new ApproveMenuReportRequest();
        ReflectionTestUtils.setField(req, "price", 2500);
        ReflectionTestUtils.setField(req, "imageUrl", "https://example.com/bread.jpg");
        ReflectionTestUtils.setField(req, "breadType", BreadType.BREAD);
        ReflectionTestUtils.setField(req, "signature", true);

        bakeryReportService.approveMenu(30L, req);

        ArgumentCaptor<Bread> captor = ArgumentCaptor.forClass(Bread.class);
        verify(breadRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("소금빵");
        assertThat(captor.getValue().getPrice()).isEqualTo(2500);
        assertThat(captor.getValue().getImageUrl()).isEqualTo("https://example.com/bread.jpg");
        assertThat(captor.getValue().getBreadType()).isEqualTo(BreadType.BREAD);
        assertThat(captor.getValue().isSignature()).isTrue();
        assertThat(report.getStatus()).isEqualTo(BakeryStatus.APPROVED);
    }

    @Test
    void approveMenu_creates_bread_without_imageUrl() {
        BakeryReport report = menuReport(30L, BakeryStatus.PENDING);
        Bakery bakery = approvedBakeryWithId(10L);
        when(bakeryReportRepository.findById(30L)).thenReturn(Optional.of(report));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(10L, BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        ApproveMenuReportRequest req = new ApproveMenuReportRequest();
        ReflectionTestUtils.setField(req, "price", 2500);
        ReflectionTestUtils.setField(req, "imageUrl", null);
        ReflectionTestUtils.setField(req, "breadType", BreadType.BREAD);
        ReflectionTestUtils.setField(req, "signature", false);

        bakeryReportService.approveMenu(30L, req);

        ArgumentCaptor<Bread> captor = ArgumentCaptor.forClass(Bread.class);
        verify(breadRepository).save(captor.capture());
        assertThat(captor.getValue().getImageUrl()).isNull();
    }

    @Test
    void approveMenu_throws_BAKERY_REPORT_ALREADY_PROCESSED_when_not_pending() {
        BakeryReport report = menuReport(30L, BakeryStatus.APPROVED);
        when(bakeryReportRepository.findById(30L)).thenReturn(Optional.of(report));

        ApproveMenuReportRequest req = new ApproveMenuReportRequest();
        ReflectionTestUtils.setField(req, "price", 2500);
        ReflectionTestUtils.setField(req, "breadType", BreadType.BREAD);
        ReflectionTestUtils.setField(req, "signature", false);

        assertThatThrownBy(() -> bakeryReportService.approveMenu(30L, req))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_REPORT_ALREADY_PROCESSED);

        verify(breadRepository, never()).save(any());
    }

    @Test
    void approveMenu_throws_BAKERY_REPORT_TYPE_MISMATCH_when_not_menu_suggestion() {
        BakeryReport report = newBakeryReport(1L, BakeryStatus.PENDING);
        when(bakeryReportRepository.findById(1L)).thenReturn(Optional.of(report));

        ApproveMenuReportRequest req = new ApproveMenuReportRequest();
        ReflectionTestUtils.setField(req, "price", 2500);
        ReflectionTestUtils.setField(req, "breadType", BreadType.BREAD);
        ReflectionTestUtils.setField(req, "signature", false);

        assertThatThrownBy(() -> bakeryReportService.approveMenu(1L, req))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_REPORT_TYPE_MISMATCH);

        verify(breadRepository, never()).save(any());
    }

    @Test
    void approveMenu_throws_BAKERY_NOT_FOUND_when_bakery_missing() {
        BakeryReport report = menuReport(30L, BakeryStatus.PENDING);
        when(bakeryReportRepository.findById(30L)).thenReturn(Optional.of(report));
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(10L, BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        ApproveMenuReportRequest req = new ApproveMenuReportRequest();
        ReflectionTestUtils.setField(req, "price", 2500);
        ReflectionTestUtils.setField(req, "breadType", BreadType.BREAD);
        ReflectionTestUtils.setField(req, "signature", false);

        assertThatThrownBy(() -> bakeryReportService.approveMenu(30L, req))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_NOT_FOUND);

        verify(breadRepository, never()).save(any());
    }

    // ── reject ────────────────────────────────────────────────────────────────

    @Test
    void reject_sets_report_status_to_REJECTED_and_does_not_create_bakery() {
        BakeryReport report = newBakeryReport(1L, BakeryStatus.PENDING);
        when(bakeryReportRepository.findById(1L)).thenReturn(Optional.of(report));

        bakeryReportService.reject(1L);

        assertThat(report.getStatus()).isEqualTo(BakeryStatus.REJECTED);
        verify(bakeryRepository, never()).save(any());
    }

    @Test
    void reject_throws_BAKERY_REPORT_ALREADY_PROCESSED_when_not_pending() {
        BakeryReport report = newBakeryReport(1L, BakeryStatus.REJECTED);
        when(bakeryReportRepository.findById(1L)).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> bakeryReportService.reject(1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.BAKERY_REPORT_ALREADY_PROCESSED);
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static BakeryReport newBakeryReport(long id, BakeryStatus status) {
        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.NEW_BAKERY)
                        .bakeryName("테스트 빵집")
                        .address("서울 강남구 역삼동 1-1")
                        .district("역삼동")
                        .build();
        ReflectionTestUtils.setField(report, "id", id);
        ReflectionTestUtils.setField(report, "status", status);
        return report;
    }

    private static BakeryReport updateBakeryReport(long id, BakeryStatus status) {
        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.UPDATE_BAKERY)
                        .targetBakeryId(10L)
                        .updateField(BakeryUpdateField.ADDRESS)
                        .correctValue("서울 강남구 삼성동 99-1")
                        .build();
        ReflectionTestUtils.setField(report, "id", id);
        ReflectionTestUtils.setField(report, "status", status);
        return report;
    }

    private static BakeryReport menuReport(long id, BakeryStatus status) {
        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.MENU_SUGGESTION)
                        .targetBakeryId(10L)
                        .menuName("소금빵")
                        .menuDescription("가격 2500원")
                        .build();
        ReflectionTestUtils.setField(report, "id", id);
        ReflectionTestUtils.setField(report, "status", status);
        return report;
    }

    private static Bakery approvedBakeryWithId(long id) {
        Bakery b =
                Bakery.builder()
                        .name("테스트빵집")
                        .address("주소")
                        .region("강남구")
                        .dong("역삼동")
                        .latitude(37.5)
                        .longitude(127.0)
                        .dineInAvailable(true)
                        .parkingAvailable(false)
                        .drinkAvailable(true)
                        .holidayClosed(false)
                        .build();
        ReflectionTestUtils.setField(b, "id", id);
        ReflectionTestUtils.setField(b, "status", BakeryStatus.APPROVED);
        return b;
    }

    private static User user(long id) {
        User u =
                User.builder()
                        .loginId("u" + id)
                        .password("p")
                        .name("n")
                        .nickname("nick")
                        .email(id + "@t.com")
                        .phone("01000000000")
                        .role(UserRole.ROLE_USER)
                        .termsAgreed(true)
                        .privacyAgreed(true)
                        .build();
        ReflectionTestUtils.setField(u, "id", id);
        return u;
    }
}

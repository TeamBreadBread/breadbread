package com.breadbread.congestion.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.congestion.dto.CongestionResponse;
import com.breadbread.congestion.dto.CongestionSignalRequest;
import com.breadbread.congestion.entity.BakeryCongestionSignal;
import com.breadbread.congestion.entity.CongestionLevel;
import com.breadbread.congestion.repository.BakeryCongestionSignalRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class CongestionSignalServiceTest {

    @InjectMocks private CongestionSignalService service;
    @Mock private BakeryCongestionSignalRepository repository;
    @Mock private BakeryRepository bakeryRepository;

    // ── save (단건) ───────────────────────────────────────────────────────────

    @Test
    void save_saves_validSignal() {
        Bakery bakery = bakery(1L, "파리바게뜨");
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        1L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        service.save(signalRequest(1L, "파리바게뜨"));

        verify(repository).save(any(BakeryCongestionSignal.class));
    }

    @Test
    void save_skips_whenBakeryIdNotFound() {
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        99L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.empty());

        service.save(signalRequest(99L, "없는빵집"));

        verify(repository, never()).save(any());
    }

    @Test
    void save_saves_withNameMismatchWarning() {
        Bakery bakery = bakery(1L, "파리바게뜨");
        when(bakeryRepository.findByIdAndActiveTrueAndStatus(
                        1L, com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(Optional.of(bakery));

        service.save(signalRequest(1L, "틀린이름"));

        verify(repository).save(any(BakeryCongestionSignal.class));
    }

    // ── saveAll ───────────────────────────────────────────────────────────────

    @Test
    void saveAll_saves_validSignals() {
        Bakery bakery = bakery(1L, "파리바게뜨");
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(1L), com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(List.of(bakery));

        service.saveAll(List.of(signalRequest(1L, "파리바게뜨")));

        ArgumentCaptor<List<BakeryCongestionSignal>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getBakeryId()).isEqualTo(1L);
    }

    @Test
    void saveAll_skips_whenBakeryIdNotFound() {
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(99L), com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(List.of());

        service.saveAll(List.of(signalRequest(99L, "없는빵집")));

        verify(repository, never()).saveAll(anyList());
    }

    @Test
    void saveAll_saves_withNameMismatchWarning() {
        Bakery bakery = bakery(1L, "파리바게뜨");
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(1L), com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(List.of(bakery));

        // n8n이 잘못된 이름을 보내도 저장은 됨
        service.saveAll(List.of(signalRequest(1L, "틀린이름")));

        ArgumentCaptor<List<BakeryCongestionSignal>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
    }

    @Test
    void saveAll_skipsInvalid_andSavesValid_inMixedList() {
        Bakery bakery = bakery(1L, "파리바게뜨");
        when(bakeryRepository.findAllByIdInAndActiveTrueAndStatus(
                        List.of(1L, 99L), com.breadbread.bakery.entity.BakeryStatus.APPROVED))
                .thenReturn(List.of(bakery));

        service.saveAll(List.of(signalRequest(1L, "파리바게뜨"), signalRequest(99L, "없는빵집")));

        ArgumentCaptor<List<BakeryCongestionSignal>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).saveAll(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
        assertThat(captor.getValue().get(0).getBakeryId()).isEqualTo(1L);
    }

    // ── getByBakeryId ─────────────────────────────────────────────────────────

    @Test
    void getByBakeryId_returnsResponse_whenSignalExists() {
        BakeryCongestionSignal signal = signal(1L, "파리바게뜨", CongestionLevel.HIGH);
        when(repository.findTopByBakeryIdOrderByCollectedAtDescIdDesc(1L))
                .thenReturn(Optional.of(signal));

        CongestionResponse response = service.getByBakeryId(1L);

        assertThat(response.getBakeryId()).isEqualTo(1L);
        assertThat(response.getBakeryName()).isEqualTo("파리바게뜨");
        assertThat(response.getLevel()).isEqualTo("HIGH");
    }

    @Test
    void getByBakeryId_throws_CONGESTION_NOT_FOUND_whenNoSignal() {
        when(repository.findTopByBakeryIdOrderByCollectedAtDescIdDesc(1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.getByBakeryId(1L))
                .isInstanceOf(CustomException.class)
                .extracting("errorCode")
                .isEqualTo(ErrorCode.CONGESTION_NOT_FOUND);
    }

    // ── getByBakeryIds ────────────────────────────────────────────────────────

    @Test
    void getByBakeryIds_returnsSortedResponses() {
        BakeryCongestionSignal low = signal(1L, "여유빵집", CongestionLevel.LOW);
        BakeryCongestionSignal high = signal(2L, "붐비는빵집", CongestionLevel.HIGH);
        // repository는 congestionScore ASC 정렬해서 반환
        when(repository.findLatestByBakeryIds(List.of(1L, 2L))).thenReturn(List.of(low, high));

        List<CongestionResponse> responses = service.getByBakeryIds(List.of(1L, 2L));

        assertThat(responses).hasSize(2);
        assertThat(responses.get(0).getBakeryId()).isEqualTo(1L);
        assertThat(responses.get(1).getBakeryId()).isEqualTo(2L);
    }

    @Test
    void getByBakeryIds_returnsEmpty_whenNoSignals() {
        when(repository.findLatestByBakeryIds(List.of(1L, 2L))).thenReturn(List.of());

        List<CongestionResponse> responses = service.getByBakeryIds(List.of(1L, 2L));

        assertThat(responses).isEmpty();
    }

    // ── CongestionResponse.from ───────────────────────────────────────────────

    @Test
    void from_mapsAllFields_correctly() {
        BakeryCongestionSignal signal = signal(1L, "파리바게뜨", CongestionLevel.MEDIUM);

        CongestionResponse response = CongestionResponse.from(signal);

        assertThat(response.getBakeryId()).isEqualTo(1L);
        assertThat(response.getBakeryName()).isEqualTo("파리바게뜨");
        assertThat(response.getLevel()).isEqualTo("MEDIUM");
        assertThat(response.getCongestionScore()).isEqualTo(55.0);
        assertThat(response.getExpectedWaitMin()).isEqualTo(10);
        assertThat(response.getSignals()).isNotNull();
        assertThat(response.getSignals().getWaitingKeywordCount()).isEqualTo(3);
    }

    @Test
    void from_handlesNullLevel() {
        BakeryCongestionSignal signal = signal(1L, "파리바게뜨", null);

        CongestionResponse response = CongestionResponse.from(signal);

        assertThat(response.getLevel()).isNull();
    }

    // ── helpers ───────────────────────────────────────────────────────────────

    private static Bakery bakery(Long id, String name) {
        Bakery bakery =
                Bakery.builder()
                        .name(name)
                        .address("서울")
                        .latitude(37.5)
                        .longitude(127.0)
                        .phone("02-0000-0000")
                        .build();
        ReflectionTestUtils.setField(bakery, "id", id);
        return bakery;
    }

    private static CongestionSignalRequest signalRequest(Long bakeryId, String bakeryName) {
        CongestionSignalRequest req = new CongestionSignalRequest();
        ReflectionTestUtils.setField(req, "bakeryId", bakeryId);
        ReflectionTestUtils.setField(req, "bakeryName", bakeryName);
        ReflectionTestUtils.setField(req, "congestionScore", 70.0);
        ReflectionTestUtils.setField(req, "level", "HIGH");
        ReflectionTestUtils.setField(req, "expectedWaitMin", 15);
        ReflectionTestUtils.setField(req, "collectedAt", LocalDateTime.now());
        return req;
    }

    private static BakeryCongestionSignal signal(
            Long bakeryId, String bakeryName, CongestionLevel level) {
        BakeryCongestionSignal signal =
                BakeryCongestionSignal.builder()
                        .bakeryId(bakeryId)
                        .bakeryName(bakeryName)
                        .congestionScore(55.0)
                        .level(level)
                        .expectedWaitMin(10)
                        .reason("SNS 언급 증가")
                        .waitingKeywordCount(3)
                        .openRunKeywordCount(1)
                        .soldOutKeywordCount(0)
                        .recentMentionCount(20)
                        .morningMentions(5)
                        .afternoonMentions(10)
                        .eveningMentions(5)
                        .collectedAt(LocalDateTime.now())
                        .build();
        ReflectionTestUtils.setField(signal, "id", bakeryId);
        return signal;
    }
}

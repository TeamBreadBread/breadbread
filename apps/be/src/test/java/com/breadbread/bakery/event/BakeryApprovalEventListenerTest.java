package com.breadbread.bakery.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.congestion.service.CongestionSignalService;
import com.breadbread.tour.client.CongestionInstantCheckClient;
import com.breadbread.tour.dto.CongestionInstantCheckResponse;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class BakeryApprovalEventListenerTest {

    @Mock private CongestionInstantCheckClient congestionInstantCheckClient;
    @Mock private CongestionSignalService congestionSignalService;

    @InjectMocks private BakeryApprovalEventListener listener;

    @Test
    void onBakeriesApproved_sends_userId_and_bakeryIds_to_n8n() {
        CongestionInstantCheckResponse response = new CongestionInstantCheckResponse();
        ReflectionTestUtils.setField(response, "success", true);
        ReflectionTestUtils.setField(response, "data", List.of());
        when(congestionInstantCheckClient.check(any())).thenReturn(response);

        listener.onBakeriesApproved(new BakeriesApprovedEvent(99L, List.of(1L, 2L)));

        ArgumentCaptor<Map> bodyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(congestionInstantCheckClient).check(bodyCaptor.capture());
        Map<?, ?> body = bodyCaptor.getValue();
        assert body.get("userId").equals(99L);
        assert body.get("bakeryIds").equals(List.of(1L, 2L));
    }

    @Test
    void onBakeriesApproved_saves_with_allowed_ids() {
        CongestionInstantCheckResponse.CongestionResult result =
                new CongestionInstantCheckResponse.CongestionResult();
        ReflectionTestUtils.setField(result, "bakeryId", 1L);

        CongestionInstantCheckResponse response = new CongestionInstantCheckResponse();
        ReflectionTestUtils.setField(response, "success", true);
        ReflectionTestUtils.setField(response, "data", List.of(result));
        when(congestionInstantCheckClient.check(any())).thenReturn(response);

        listener.onBakeriesApproved(new BakeriesApprovedEvent(99L, List.of(1L, 2L)));

        verify(congestionSignalService).saveAllFromInstantCheck(List.of(result), Set.of(1L, 2L));
    }

    @Test
    void onBakeriesApproved_does_not_propagate_exception() {
        when(congestionInstantCheckClient.check(any())).thenThrow(new RuntimeException("n8n 오류"));

        listener.onBakeriesApproved(new BakeriesApprovedEvent(99L, List.of(1L)));

        verify(congestionSignalService, never()).saveAllFromInstantCheck(any(), any());
    }
}

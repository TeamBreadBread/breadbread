package com.breadbread.bakery.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.breadbread.tour.client.CongestionInstantCheckClient;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class BakeryApprovalEventListenerTest {

    @Mock private CongestionInstantCheckClient congestionInstantCheckClient;

    @InjectMocks private BakeryApprovalEventListener listener;

    @Test
    void onBakeriesApproved_sends_userId_and_bakeryIds_to_n8n() {
        listener.onBakeriesApproved(new BakeriesApprovedEvent(99L, List.of(1L, 2L)));

        ArgumentCaptor<Map> bodyCaptor = ArgumentCaptor.forClass(Map.class);
        verify(congestionInstantCheckClient).check(bodyCaptor.capture());
        Map<?, ?> body = bodyCaptor.getValue();
        assert body.get("userId").equals(99L);
        assert body.get("bakeryIds").equals(List.of(1L, 2L));
    }

    @Test
    void onBakeriesApproved_does_not_propagate_exception() {
        when(congestionInstantCheckClient.check(any())).thenThrow(new RuntimeException("n8n 오류"));

        listener.onBakeriesApproved(new BakeriesApprovedEvent(99L, List.of(1L)));

        // 예외가 외부로 전파되지 않으면 통과
    }
}

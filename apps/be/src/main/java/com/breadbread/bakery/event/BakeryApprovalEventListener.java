package com.breadbread.bakery.event;

import com.breadbread.congestion.service.CongestionSignalService;
import com.breadbread.tour.client.CongestionInstantCheckClient;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class BakeryApprovalEventListener {

    private final CongestionInstantCheckClient congestionInstantCheckClient;
    private final CongestionSignalService congestionSignalService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onBakeriesApproved(BakeriesApprovedEvent event) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("userId", event.getAdminUserId());
            body.put("bakeryIds", event.getApprovedBakeryIds());
            congestionSignalService.saveAllFromInstantCheck(
                    congestionInstantCheckClient.check(body).getData(),
                    new HashSet<>(event.getApprovedBakeryIds()));
        } catch (Exception e) {
            log.warn("빵집 승인 후 혼잡도 초기화 실패: {}", e.getMessage());
        }
    }
}

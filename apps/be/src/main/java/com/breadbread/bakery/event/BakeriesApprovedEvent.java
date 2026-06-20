package com.breadbread.bakery.event;

import java.util.List;
import lombok.Getter;
import lombok.RequiredArgsConstructor;

@Getter
@RequiredArgsConstructor
public class BakeriesApprovedEvent {
    private final Long adminUserId;
    private final List<Long> approvedBakeryIds;
}

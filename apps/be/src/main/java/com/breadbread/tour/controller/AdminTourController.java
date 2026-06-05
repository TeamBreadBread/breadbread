package com.breadbread.tour.controller;

import com.breadbread.tour.dto.ActiveTourResponse;
import com.breadbread.tour.service.ActiveTourService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "관리자 - 투어")
@RestController
@RequestMapping("/admin/tours")
@RequiredArgsConstructor
public class AdminTourController {

    private final ActiveTourService activeTourService;

    @Operation(
            summary = "[n8n] 활성 투어 목록 조회",
            description =
                    "현재 투어 중(IN_PROGRESS) 및 출발 30분 이내 예약 임박(PRE_DEPARTURE) 투어를 반환합니다."
                            + " X-AI-API-KEY 헤더 필요.")
    @GetMapping("/active")
    public List<ActiveTourResponse> getActiveTours() {
        return activeTourService.getActiveTours();
    }
}

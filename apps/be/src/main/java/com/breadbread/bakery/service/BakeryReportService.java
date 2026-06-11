package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.BakeryReportListResponse;
import com.breadbread.bakery.dto.BakeryReportResponse;
import com.breadbread.bakery.dto.CreateNewBakeryReportRequest;
import com.breadbread.bakery.dto.CreateUpdateBakeryReportRequest;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryReport;
import com.breadbread.bakery.entity.BakeryReportType;
import com.breadbread.bakery.entity.BakeryStatus;
import com.breadbread.bakery.repository.BakeryReportRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.global.exception.CustomException;
import com.breadbread.global.exception.ErrorCode;
import com.breadbread.user.entity.User;
import com.breadbread.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class BakeryReportService {

    private final BakeryReportRepository bakeryReportRepository;
    private final BakeryRepository bakeryRepository;
    private final UserRepository userRepository;

    @Transactional
    public Long submitNew(Long userId, CreateNewBakeryReportRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.NEW_BAKERY)
                        .user(user)
                        .bakeryName(request.getBakeryName())
                        .address(request.getAddress())
                        .district(request.getDistrict())
                        .representativeMenus(request.getRepresentativeMenus())
                        .recommendation(request.getRecommendation())
                        .build();

        Long reportId = bakeryReportRepository.save(report).getId();
        log.info("새 빵집 제보 등록: reportId={}, userId={}", reportId, userId);
        return reportId;
    }

    @Transactional
    public Long submitUpdate(Long userId, CreateUpdateBakeryReportRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));

        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.UPDATE_BAKERY)
                        .user(user)
                        .targetBakeryName(request.getTargetBakeryName())
                        .updateField(request.getUpdateField())
                        .correctValue(request.getCorrectValue())
                        .description(request.getDescription())
                        .build();

        Long reportId = bakeryReportRepository.save(report).getId();
        log.info("빵집 정보 수정 제보 등록: reportId={}, userId={}", reportId, userId);
        return reportId;
    }

    @Transactional(readOnly = true)
    public BakeryReportListResponse getReports(BakeryStatus status, Pageable pageable) {
        Page<BakeryReport> page =
                status != null
                        ? bakeryReportRepository.findAllByStatus(status, pageable)
                        : bakeryReportRepository.findAll(pageable);
        return BakeryReportListResponse.builder()
                .reports(page.getContent().stream().map(BakeryReportResponse::from).toList())
                .total((int) page.getTotalElements())
                .page(pageable.getPageNumber())
                .size(pageable.getPageSize())
                .hasNext(page.hasNext())
                .build();
    }

    @Transactional
    public void approve(Long reportId) {
        BakeryReport report = findReport(reportId);
        if (report.getStatus() != BakeryStatus.PENDING) {
            throw new CustomException(ErrorCode.BAKERY_REPORT_ALREADY_PROCESSED);
        }
        if (report.getType() == BakeryReportType.NEW_BAKERY) {
            Bakery pendingBakery =
                    Bakery.builder()
                            .name(report.getBakeryName())
                            .address(report.getAddress())
                            .dong(report.getDistrict())
                            .latitude(0)
                            .longitude(0)
                            .holidayClosed(false)
                            .drinkAvailable(false)
                            .dineInAvailable(false)
                            .parkingAvailable(false)
                            .build();
            pendingBakery.markAsPending();
            bakeryRepository.save(pendingBakery);
        } else if (report.getType() == BakeryReportType.UPDATE_BAKERY) {
            applyUpdateReport(report);
        }
        report.approve();
        log.info("빵집 제보 승인: reportId={}, type={}", reportId, report.getType());
    }

    @Transactional
    public void reject(Long reportId) {
        BakeryReport report = findReport(reportId);
        if (report.getStatus() != BakeryStatus.PENDING) {
            throw new CustomException(ErrorCode.BAKERY_REPORT_ALREADY_PROCESSED);
        }
        report.reject();
        log.info("빵집 제보 거절: reportId={}, type={}", reportId, report.getType());
    }

    private void applyUpdateReport(BakeryReport report) {
        Bakery bakery =
                bakeryRepository
                        .findFirstByNameAndActiveTrue(report.getTargetBakeryName())
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));
        switch (report.getUpdateField()) {
            case ADDRESS -> bakery.updateAddress(report.getCorrectValue());
            case DISTRICT -> bakery.updateDong(report.getCorrectValue());
            default ->
                    log.info(
                            "수동 반영 필요: reportId={}, field={}",
                            report.getId(),
                            report.getUpdateField());
        }
    }

    private BakeryReport findReport(Long reportId) {
        return bakeryReportRepository
                .findById(reportId)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_REPORT_NOT_FOUND));
    }
}

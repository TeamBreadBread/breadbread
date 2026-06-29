package com.breadbread.bakery.service;

import com.breadbread.bakery.dto.request.ApproveMenuReportRequest;
import com.breadbread.bakery.dto.request.CreateMenuReportRequest;
import com.breadbread.bakery.dto.request.CreateNewBakeryReportRequest;
import com.breadbread.bakery.dto.request.CreateUpdateBakeryReportRequest;
import com.breadbread.bakery.dto.response.BakeryReportListResponse;
import com.breadbread.bakery.dto.response.BakeryReportResponse;
import com.breadbread.bakery.entity.Bakery;
import com.breadbread.bakery.entity.BakeryReport;
import com.breadbread.bakery.entity.Bread;
import com.breadbread.bakery.entity.enums.BakeryReportType;
import com.breadbread.bakery.entity.enums.BakeryStatus;
import com.breadbread.bakery.repository.BakeryReportRepository;
import com.breadbread.bakery.repository.BakeryRepository;
import com.breadbread.bakery.repository.BreadRepository;
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
    private final BreadRepository breadRepository;
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

        bakeryRepository
                .findByIdAndActiveTrueAndStatus(request.getTargetBakeryId(), BakeryStatus.APPROVED)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.UPDATE_BAKERY)
                        .user(user)
                        .targetBakeryId(request.getTargetBakeryId())
                        .updateField(request.getUpdateField())
                        .correctValue(request.getCorrectValue())
                        .description(request.getDescription())
                        .build();

        Long reportId = bakeryReportRepository.save(report).getId();
        log.info("빵집 정보 수정 제보 등록: reportId={}, userId={}", reportId, userId);
        return reportId;
    }

    @Transactional
    public Long submitMenu(Long userId, CreateMenuReportRequest request) {
        User user =
                userRepository
                        .findById(userId)
                        .orElseThrow(() -> new CustomException(ErrorCode.USER_NOT_FOUND));
        bakeryRepository
                .findByIdAndActiveTrueAndStatus(request.getBakeryId(), BakeryStatus.APPROVED)
                .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        BakeryReport report =
                BakeryReport.builder()
                        .type(BakeryReportType.MENU_SUGGESTION)
                        .user(user)
                        .targetBakeryId(request.getBakeryId())
                        .menuName(request.getMenuName())
                        .menuDescription(request.getDescription())
                        .build();

        Long reportId = bakeryReportRepository.save(report).getId();
        log.info(
                "메뉴 건의 등록: reportId={}, userId={}, bakeryId={}",
                reportId,
                userId,
                request.getBakeryId());
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
        if (report.getType() == BakeryReportType.MENU_SUGGESTION) {
            throw new CustomException(ErrorCode.BAKERY_REPORT_TYPE_MISMATCH);
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
            bakeryRepository.save(pendingBakery);
        } else if (report.getType() == BakeryReportType.UPDATE_BAKERY) {
            applyUpdateReport(report);
        }
        report.approve();
        log.info("빵집 제보 승인: reportId={}, type={}", reportId, report.getType());
    }

    @Transactional
    public void approveMenu(Long reportId, ApproveMenuReportRequest request) {
        BakeryReport report = findReport(reportId);
        if (report.getStatus() != BakeryStatus.PENDING) {
            throw new CustomException(ErrorCode.BAKERY_REPORT_ALREADY_PROCESSED);
        }
        if (report.getType() != BakeryReportType.MENU_SUGGESTION) {
            throw new CustomException(ErrorCode.BAKERY_REPORT_TYPE_MISMATCH);
        }
        Bakery bakery =
                bakeryRepository
                        .findByIdAndActiveTrueAndStatus(
                                report.getTargetBakeryId(), BakeryStatus.APPROVED)
                        .orElseThrow(() -> new CustomException(ErrorCode.BAKERY_NOT_FOUND));

        Bread bread =
                Bread.builder()
                        .name(report.getMenuName())
                        .price(request.getPrice())
                        .imageUrl(request.getImageUrl())
                        .breadType(request.getBreadType())
                        .bakery(bakery)
                        .signature(Boolean.TRUE.equals(request.getSignature()))
                        .selloutMin(0)
                        .build();
        breadRepository.save(bread);
        report.approve();
        log.info(
                "메뉴 건의 승인: reportId={}, bakeryId={}, menuName={}",
                reportId,
                bakery.getId(),
                bread.getName());
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
                        .findByIdAndActiveTrueAndStatus(
                                report.getTargetBakeryId(), BakeryStatus.APPROVED)
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

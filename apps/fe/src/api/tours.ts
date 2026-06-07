import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/tours";

/** 투어 상태 — 진행 중 / 완료 */
export type TourStatus = "IN_PROGRESS" | "COMPLETED";

/** `POST /tours/{courseId}/start` 응답 */
export type TourStartResponse = {
  courseId: number;
  totalBakeryCount: number;
  status: TourStatus;
};

/**
 * 투어 진행 상태 (`complete`, `visit`, `current` 공통).
 * `startedAt`은 일부 응답에만 포함될 수 있어 옵셔널로 둔다.
 */
export type TourCurrentResponse = {
  courseId: number;
  currentVisitOrder: number;
  remainingCount: number;
  status: TourStatus;
  startedAt?: string | null;
};

/**
 * `POST /tours/{courseId}/start` — 코스 투어 시작.
 * 이미 진행 중인 투어가 있으면 409.
 */
export async function startTour(courseId: number): Promise<TourStartResponse> {
  const { data } = await apiClient.post<ApiEnvelope<TourStartResponse>>(
    `${PATH}/${courseId}/start`,
  );
  return extractData(data);
}

/**
 * `POST /tours/{courseId}/complete` — 마지막 빵집 방문 외에 명시적으로 투어를 완료.
 */
export async function completeTour(courseId: number): Promise<TourCurrentResponse> {
  const { data } = await apiClient.post<ApiEnvelope<TourCurrentResponse>>(
    `${PATH}/${courseId}/complete`,
  );
  return extractData(data);
}

/**
 * `PATCH /tours/{courseId}/visit/{order}` — n번째 빵집 방문 기록.
 * 마지막 빵집 방문 시 투어가 자동 완료된다.
 */
export async function checkTourVisit(
  courseId: number,
  order: number,
): Promise<TourCurrentResponse> {
  const { data } = await apiClient.patch<ApiEnvelope<TourCurrentResponse>>(
    `${PATH}/${courseId}/visit/${order}`,
  );
  return extractData(data);
}

/**
 * `GET /tours/current` — 현재 투어 조회 (앱 재접속 시 상태 복구용).
 * 진행 중이거나 완료 후 1시간 이내면 데이터를 반환하고, 그 외에는 null일 수 있다.
 */
export async function getCurrentTour(): Promise<TourCurrentResponse | null> {
  const { data } = await apiClient.get<ApiEnvelope<TourCurrentResponse | null>>(`${PATH}/current`);
  return extractData(data) ?? null;
}

export type CongestionCheckSignals = {
  waitingKeywordCount?: number | null;
  openRunKeywordCount?: number | null;
  soldOutKeywordCount?: number | null;
  recentMentionCount?: number | null;
  morningMentions?: number | null;
  afternoonMentions?: number | null;
  eveningMentions?: number | null;
};

export type CongestionCheckResult = {
  userId?: number | null;
  courseId?: number | null;
  bakeryId: number;
  bakeryName: string;
  congestionScore?: number | null;
  level?: string | null;
  expectedWaitMin?: number | null;
  reason?: string | null;
  signals?: CongestionCheckSignals | null;
  checkedAt?: string | null;
};

export type CongestionInstantCheckResponse = {
  success: boolean;
  data: CongestionCheckResult[];
  error?: string | null;
};

export type CongestionInstantCheckRequest = {
  courseId: number;
  bakeryIds: number[];
  targetBakeryId?: number | null;
};

/**
 * `POST /tours/congestion-check` — 코스 내 빵집 혼잡도 즉시 분석.
 * `targetBakeryId`가 있으면 해당 빵집만, 없으면 `bakeryIds` 전체를 분석합니다.
 */
export async function checkTourCongestion(
  body: CongestionInstantCheckRequest,
): Promise<CongestionInstantCheckResponse> {
  const { data } = await apiClient.post<ApiEnvelope<CongestionInstantCheckResponse>>(
    `${PATH}/congestion-check`,
    body,
  );
  return extractData(data);
}

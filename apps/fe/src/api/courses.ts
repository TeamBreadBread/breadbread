import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

export type TravelType = "COUPLE" | "FRIENDS" | "FAMILY" | "ALONE";
export type BudgetRange = "UNDER_20000" | "BETWEEN_20000_40000" | "OVER_40000" | "ANY";
export type FlexibilityLevel = "SOLDOUT_ONLY" | "ACTIVE" | "MAINTAIN";
export type BreadType = "BREAD" | "SANDWICH" | "CAKE" | "RICE_CAKE" | "COOKIE" | "DIET";

const PATH = "/courses";

export type CourseBakerySummary = {
  id: number;
  name: string;
  region: string;
  rating: number;
  thumbnailUrl: string;
};

export type CourseSummaryItem = {
  id: number;
  name: string;
  thumbnailUrl: string;
  bakeryCount: number;
  estimatedTime: string;
  estimatedCost: number;
  likeCount: number;
  liked: boolean;
  saved?: boolean;
  bakeries: CourseBakerySummary[];
  theme?: string;
};

export type CourseListResponse = {
  courses: CourseSummaryItem[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type CourseBakeryDetail = {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  thumbnailUrl: string;
  previewImageUrls: string[];
  remainingPreviewImageCount: number;
  rating: number;
  openTime: string;
  closeTime: string;
  likeCount: number;
  liked: boolean;
  reason?: string | null;
  recommendedBread?: string | null;
};

export type CourseDetail = {
  id: number;
  name: string;
  thumbnailUrl: string;
  bakeryCount: number;
  estimatedTime: string;
  estimatedCost: number;
  likeCount: number;
  liked: boolean;
  recommendReason?: string | null;
  summary?: string | null;
  departureLatitude?: number | null;
  departureLongitude?: number | null;
  bakeries: CourseBakeryDetail[];
};

export type CourseDirectionPoint = {
  lat: number;
  lng: number;
};

export type CourseDirections = {
  path: CourseDirectionPoint[];
  legs: number[];
  stayMinutesPerBakery: number[];
  totalTravelMinutes: number;
  totalStayMinutes: number;
  totalMinutes: number;
};

export type GetCoursesParams = {
  region?: string;
  breadType?: BreadType;
  theme?: string;
  editorPick?: boolean;
  page?: number;
  size?: number;
};

export type ManualCourseRequest = {
  name: string;
  thumbnailUrl: string;
  estimatedTime: string;
  estimatedCost: number;
  editorPick: boolean;
  region: string;
  theme: string;
  breadType: BreadType;
  bakeryIds: number[];
};

export type AiCourseRequest = {
  travelType: TravelType;
  budgetRange: BudgetRange;
  minimizeRoute: boolean;
  breadTypes: BreadType[];
  latitude: number;
  longitude: number;
  waitingPreference: boolean;
  drinkPreference: boolean;
  bakeryCount: number;
  flexibilityLevel: FlexibilityLevel;
};

export type AiCourseStatusResponse = {
  status: "PENDING" | "COMPLETED" | "FAILED";
  errorMessage: string | null;
};

/** Swagger `GET /courses/ai/{jobId}/preview` 응답 빵집 항목 */
export type AiCoursePreviewBakery = {
  id: number;
  order: number;
  name: string;
  recommendedBread: string | null;
  reason: string | null;
  address: string;
  latitude: number;
  longitude: number;
  rating: number | null;
};

/** Swagger `GET /courses/ai/{jobId}/preview` — Redis 임시 저장본 (24시간 내 저장 필요) */
export type AiCoursePreview = {
  name: string;
  bakeryCount: number;
  estimatedTime: string;
  estimatedCost: number;
  theme: string | null;
  summary: string | null;
  recommendReason: string | null;
  bakeries: AiCoursePreviewBakery[];
};

export type MyRouteCourse = {
  courseId: number;
  name: string;
  estimatedTime: string;
  bakeryCount: number;
  bakeryNames: string[];
};

export type ReorderCourseBakeriesRequest = {
  bakeryOrder: number[];
};

export type ReorderCourseBakeriesResponse = {
  courseId: number;
  bakeryOrder: number[];
  estimatedTotalMinutes: number;
};

export async function getCourses(params?: GetCoursesParams): Promise<CourseListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<CourseListResponse>>(PATH, { params });
  return extractData(data);
}

export async function getCourseDetail(courseId: number): Promise<CourseDetail> {
  const response = await apiClient.get<ApiEnvelope<CourseDetail>>(`${PATH}/${courseId}`);
  return extractData(response.data);
}

export async function getCourseDirections(courseId: number): Promise<CourseDirections> {
  const response = await apiClient.get<ApiEnvelope<CourseDirections>>(
    `${PATH}/${courseId}/directions`,
  );
  return extractData(response.data);
}

export async function likeCourse(courseId: number): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${courseId}/likes`,
  );
  extractData(data);
}

export async function unlikeCourse(courseId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${courseId}/likes`,
  );
  extractData(data);
}

export async function saveCourseRoute(courseId: number): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${courseId}/routes`,
  );
  extractData(data);
}

export async function removeCourseRoute(courseId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${courseId}/routes`,
  );
  extractData(data);
}

export async function createManualCourse(payload: ManualCourseRequest): Promise<number> {
  const { data } = await apiClient.post<ApiEnvelope<number>>(`${PATH}/manual`, payload);
  return extractData(data);
}

export async function updateManualCourse(
  courseId: number,
  payload: ManualCourseRequest,
): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${courseId}/manual`,
    payload,
  );
  extractData(data);
}

export async function deleteAiCourse(courseId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${courseId}/ai`,
  );
  extractData(data);
}

export async function deleteCourse(courseId: number): Promise<void> {
  const { data } = await apiClient.delete<ApiEnvelope<Record<string, never>>>(
    `${PATH}/${courseId}`,
  );
  extractData(data);
}

export async function getMyCourseRoutes(): Promise<MyRouteCourse[]> {
  const { data } = await apiClient.get<ApiEnvelope<MyRouteCourse[]>>(`${PATH}/me/routes`);
  return extractData(data);
}

export async function requestAiCourse(body: AiCourseRequest): Promise<string> {
  const response = await apiClient.post<ApiEnvelope<string>>(`${PATH}/ai`, body);
  return extractData(response.data);
}

export async function getAiCourseStatus(jobId: string): Promise<AiCourseStatusResponse> {
  const response = await apiClient.get<ApiEnvelope<AiCourseStatusResponse>>(
    `${PATH}/ai/status/${jobId}`,
  );
  return extractData(response.data);
}

/** `GET /courses/ai/{jobId}/preview` — 추천 완료 후 저장 전 미리보기 */
export async function getAiCoursePreview(jobId: string): Promise<AiCoursePreview> {
  const response = await apiClient.get<ApiEnvelope<AiCoursePreview>>(`${PATH}/ai/${jobId}/preview`);
  return extractData(response.data);
}

/**
 * `POST /courses/ai/{jobId}/save` — 미리보기 확인 후 코스를 내 목록에 저장.
 * bakeryOrder 미전달 시 AI 추천 순서 그대로 저장. 저장된 courseId 반환.
 */
export async function saveAiCourse(jobId: string, bakeryOrder?: number[]): Promise<number> {
  const response = await apiClient.post<ApiEnvelope<number>>(
    `${PATH}/ai/${jobId}/save`,
    bakeryOrder && bakeryOrder.length > 0 ? { bakeryOrder } : {},
  );
  return extractData(response.data);
}

export async function reorderCourseBakeries(
  courseId: number,
  body: ReorderCourseBakeriesRequest,
): Promise<ReorderCourseBakeriesResponse> {
  const response = await apiClient.patch<ApiEnvelope<ReorderCourseBakeriesResponse>>(
    `${PATH}/${courseId}/bakeries/reorder`,
    body,
  );
  return extractData(response.data);
}

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
  bakeries: CourseBakerySummary[];
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
  bakeries: CourseBakeryDetail[];
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
  courseId: number | null;
  errorMessage: string | null;
};

export type MyRouteCourse = {
  courseId: number;
  name: string;
  estimatedTime: string;
  bakeryCount: number;
  bakeryNames: string[];
};

export async function getCourses(params?: GetCoursesParams): Promise<CourseListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<CourseListResponse>>(PATH, { params });
  return extractData(data);
}

export async function getCourseDetail(courseId: number): Promise<CourseDetail> {
  const response = await apiClient.get<ApiEnvelope<CourseDetail>>(`${PATH}/${courseId}`);
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

import { apiClient, extractData } from "@/api/client";
import { ApiBusinessError, type ApiEnvelope } from "@/api/types/common";
import type { BakeryListItem } from "@/api/types/bakery";
import type { CourseSummaryItem } from "@/api/courses";
import type { PostListResponse } from "@/api/posts";

const PATH = "/users";

export type MyProfileResponse = {
  /** 백엔드 `UserProfileResponse.userId` */
  userId?: number | null;
  loginId?: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  nickname?: string | null;
  grade?: string | null;
  profileImageUrl?: string | null;
  /** 소셜 로그인(Google/Kakao 등) 계정 — 로컬 비밀번호 없음 */
  socialUser?: boolean;
};

export type UpdateMyProfileRequest = {
  nickname?: string;
  email?: string;
  profileImageUrl?: string;
};

export type ChangeMyPhoneRequest = {
  phone: string;
  verificationToken: string;
};

export type ChangeMyPasswordRequest = {
  currentPassword: string;
  newPassword: string;
  newPasswordConfirm: string;
};

export type MyReviewItem = {
  reviewId: number;
  bakeryId: number;
  bakeryName: string;
  rating: number;
  content: string;
  imageUrls: string[];
  createdAt: string;
};

export type MyReviewsResponse = {
  reviews: MyReviewItem[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type LikedCoursesResponse = {
  courses: Array<
    CourseSummaryItem & {
      saved: boolean;
    }
  >;
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type LikedBakeriesResponse = {
  bakeries: BakeryListItem[];
  total: number;
  page: number;
  size: number;
  hasNext: boolean;
};

export type PaginationParams = {
  page?: number;
  size?: number;
};

/** `BakeryType` 나열값 — Swagger 참고 */
export type BakeryType = "CLASSIC" | "DESSERT" | "K_DESSERT" | "GOURMET" | "TRENDY" | "PLAIN";

/** `BakeryPersonality` */
export type BakeryPersonality =
  | "LANDMARK"
  | "HIDDEN_GEM"
  | "HOT_PLACE"
  | "HERITAGE"
  | "HIP_AND_INDUSTRIAL";

/** `BakeryUseType` */
export type BakeryUseType = "TAKEOUT" | "CAFE_STYLE" | "MOODY_SPACE" | "PRACTICAL";

/** `WaitingTolerance` */
export type WaitingTolerance = "NO_WAIT" | "UNDER_20" | "UNDER_30" | "ANYTIME";

export type UserPreferenceBakeryType = "PLAIN" | "DESSERT";
export type UserPreferenceBakeryPersonality = "HIDDEN_GEM" | "HERITAGE";
export type UserPreferenceBakeryUseType = "TAKEOUT" | "CAFE_STYLE";
export type UserPreferenceWaitingTolerance = "UNDER_20";

export interface UserPreferenceRequest {
  bakeryTypes: UserPreferenceBakeryType[];
  bakeryPersonalities: UserPreferenceBakeryPersonality[];
  bakeryUseTypes: UserPreferenceBakeryUseType[];
  waitingTolerance: UserPreferenceWaitingTolerance;
}

export type SavePreferenceRequest = {
  bakeryTypes?: BakeryType[];
  bakeryPersonalities?: BakeryPersonality[];
  bakeryUseTypes?: BakeryUseType[];
  waitingTolerance?: WaitingTolerance;
};

export type MyPreferenceResponse = {
  bakeryTypes: BakeryType[];
  bakeryPersonalities: BakeryPersonality[];
  bakeryUseTypes: BakeryUseType[];
  waitingTolerance: WaitingTolerance;
};

export async function savePreference(body: SavePreferenceRequest): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/preference`, body);
  extractData(data);
}

let inflightMyPreference: Promise<MyPreferenceResponse> | null = null;

export async function getMyPreference(): Promise<MyPreferenceResponse> {
  if (!inflightMyPreference) {
    inflightMyPreference = apiClient
      .get<ApiEnvelope<MyPreferenceResponse>>(`${PATH}/preference`)
      .then((response) => extractData(response.data))
      .finally(() => {
        inflightMyPreference = null;
      });
  }
  return inflightMyPreference;
}

/** 로그인 직후 라우팅용 — 저장된 선호도가 있으면 true, 없으면 false. 네트워크 등 그 외 오류는 throw */
export async function hasUserPreferenceSaved(): Promise<boolean> {
  try {
    await getMyPreference();
    return true;
  } catch (e) {
    if (
      e instanceof ApiBusinessError &&
      (e.code === "E0403" ||
        e.status === 404 ||
        /선호도 조사 결과가 없습니다/.test(e.message ?? ""))
    ) {
      return false;
    }
    throw e;
  }
}

export async function updateMyPreference(body: SavePreferenceRequest): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<void>>(`${PATH}/preference`, body);
  extractData(data);
}

export async function submitUserPreference(payload: UserPreferenceRequest): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/preference`, payload);
  extractData(data);
}

let inflightMyProfile: Promise<MyProfileResponse> | null = null;

export async function getMyProfile(): Promise<MyProfileResponse> {
  if (!inflightMyProfile) {
    inflightMyProfile = apiClient
      .get<ApiEnvelope<MyProfileResponse>>(`${PATH}/me`)
      .then((response) => extractData(response.data))
      .finally(() => {
        inflightMyProfile = null;
      });
  }
  return inflightMyProfile;
}

function buildUpdateMyProfilePayload(body: UpdateMyProfileRequest): UpdateMyProfileRequest {
  const payload: UpdateMyProfileRequest = {};

  if (body.nickname !== undefined) {
    const trimmed = body.nickname.trim();
    if (trimmed) payload.nickname = trimmed;
  }

  if (body.email !== undefined) {
    const trimmed = body.email.trim();
    if (trimmed) payload.email = trimmed;
  }

  // 빈 문자열은 "기본 이미지로 변경" 의도 — 서버에서 null 처리
  if (body.profileImageUrl !== undefined) {
    payload.profileImageUrl = body.profileImageUrl.trim();
  }

  return payload;
}

export async function updateMyProfile(body: UpdateMyProfileRequest): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/me`,
    buildUpdateMyProfilePayload(body),
  );
  extractData(data);
}

export async function updateMyPhone(body: ChangeMyPhoneRequest): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/me/phone`,
    body,
  );
  extractData(data);
}

export async function updateMyPassword(body: ChangeMyPasswordRequest): Promise<void> {
  const { data } = await apiClient.patch<ApiEnvelope<Record<string, never>>>(
    `${PATH}/me/password`,
    body,
  );
  extractData(data);
}

export async function getMyReviews(params: PaginationParams = {}): Promise<MyReviewsResponse> {
  const { data } = await apiClient.get<ApiEnvelope<MyReviewsResponse>>(`${PATH}/me/reviews`, {
    params: { page: params.page ?? 0, size: params.size ?? 10 },
  });
  return extractData(data);
}

export async function getMyPosts(params: PaginationParams = {}): Promise<PostListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<PostListResponse>>(`${PATH}/me/posts`, {
    params: { page: params.page ?? 0, size: params.size ?? 10 },
  });
  return extractData(data);
}

export async function getLikedPosts(params: PaginationParams = {}): Promise<PostListResponse> {
  const { data } = await apiClient.get<ApiEnvelope<PostListResponse>>(`${PATH}/me/liked/posts`, {
    params: { page: params.page ?? 0, size: params.size ?? 10 },
  });
  return extractData(data);
}

export async function getLikedCourses(
  params: PaginationParams = {},
): Promise<LikedCoursesResponse> {
  const { data } = await apiClient.get<ApiEnvelope<LikedCoursesResponse>>(
    `${PATH}/me/liked/courses`,
    {
      params: { page: params.page ?? 0, size: params.size ?? 10 },
    },
  );
  return extractData(data);
}

export async function getLikedBakeries(
  params: PaginationParams = {},
): Promise<LikedBakeriesResponse> {
  const { data } = await apiClient.get<ApiEnvelope<LikedBakeriesResponse>>(
    `${PATH}/me/liked/bakeries`,
    {
      params: { page: params.page ?? 0, size: params.size ?? 10 },
    },
  );
  return extractData(data);
}

export async function checkNicknameAvailable(nickname: string): Promise<boolean> {
  const { data } = await apiClient.get<ApiEnvelope<boolean>>(`${PATH}/check-nickname`, {
    params: { nickname },
  });
  return extractData(data);
}

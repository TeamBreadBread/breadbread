import { apiClient, extractData } from "@/api/client";
import type { ApiEnvelope } from "@/api/types/common";

const PATH = "/users";

export type MyProfileResponse = {
  loginId: string;
  name: string;
  email: string | null;
  phone: string | null;
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

export async function savePreference(body: SavePreferenceRequest): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/preference`, body);
  extractData(data);
}

export async function submitUserPreference(payload: UserPreferenceRequest): Promise<void> {
  const { data } = await apiClient.post<ApiEnvelope<void>>(`${PATH}/preference`, payload);
  extractData(data);
}

export async function getMyProfile(): Promise<MyProfileResponse> {
  const { data } = await apiClient.get<ApiEnvelope<MyProfileResponse>>(`${PATH}/me`);
  return extractData(data);
}

import { ApiBusinessError } from "@/api/types/common";
import type {
  BakeryPersonality,
  BakeryType,
  BakeryUseType,
  SavePreferenceRequest,
  WaitingTolerance,
} from "@/api/user";
import { hasUserPreferenceSaved, savePreference, updateMyPreference } from "@/api/user";

const BREAD_LABEL_TO_BAKERY_TYPE: Partial<Record<string, BakeryType>> = {
  빵: "PLAIN",
  샌드위치: "PLAIN",
  케이크: "DESSERT",
  전통과자: "K_DESSERT",
  쿠키: "DESSERT",
  식사빵: "PLAIN",
};

export function isPreferenceNotFoundMessage(message: string | null | undefined): boolean {
  return /선호도 조사 결과가 없습니다/.test(message ?? "");
}

export function isPreferenceNotFoundError(error: unknown): boolean {
  if (error instanceof ApiBusinessError) {
    return (
      error.code === "E0403" || (error.status === 404 && isPreferenceNotFoundMessage(error.message))
    );
  }
  if (error instanceof Error) {
    return isPreferenceNotFoundMessage(error.message);
  }
  if (typeof error === "string") {
    return isPreferenceNotFoundMessage(error);
  }
  return false;
}

/** AI 추천 2단계 선택값 → BE `POST/PATCH /users/preference` 본문 */
export function mapAiRecommendationToSavePreference(input: {
  breadTypeLabels: string[];
  waitingLabel?: string;
}): SavePreferenceRequest {
  const bakeryTypes = [
    ...new Set(
      input.breadTypeLabels
        .map((label) => BREAD_LABEL_TO_BAKERY_TYPE[label])
        .filter((value): value is BakeryType => value != null),
    ),
  ];

  const waitingTolerance: WaitingTolerance =
    input.waitingLabel === "피하고 싶어요" ? "NO_WAIT" : "ANYTIME";

  return {
    bakeryTypes: bakeryTypes.length > 0 ? bakeryTypes : (["PLAIN", "DESSERT"] as BakeryType[]),
    bakeryPersonalities: ["HIDDEN_GEM", "LANDMARK"] as BakeryPersonality[],
    bakeryUseTypes: ["TAKEOUT", "CAFE_STYLE"] as BakeryUseType[],
    waitingTolerance,
  };
}

/** AI 코스 생성·저장 전 서버에 선호도가 있도록 보장 */
export async function ensureUserPreferenceForAiCourse(
  payload: SavePreferenceRequest,
): Promise<void> {
  const hasPreference = await hasUserPreferenceSaved();
  if (hasPreference) {
    await updateMyPreference(payload);
    return;
  }

  try {
    await savePreference(payload);
  } catch (error) {
    const alreadySaved =
      error instanceof ApiBusinessError &&
      (error.code === "E0410" ||
        error.status === 409 ||
        /이미 선호도 조사를 완료/.test(error.message ?? ""));
    if (alreadySaved) {
      await updateMyPreference(payload);
      return;
    }
    throw error;
  }
}

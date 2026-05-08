import type {
  BakeryPersonality,
  BakeryType,
  BakeryUseType,
  MyPreferenceResponse,
  WaitingTolerance,
} from "@/api/user";
import type { PreferenceQuestion } from "@/components/domain/ai-course/types";

export const USER_PREFERENCE_BAKERY_TYPE_MAP: Partial<Record<string, BakeryType>> = {
  plain: "PLAIN",
  dessert: "DESSERT",
  premium: "GOURMET",
  traditional: "CLASSIC",
  trendy: "TRENDY",
};

export const USER_PREFERENCE_BAKERY_PERSONALITY_MAP: Partial<Record<string, BakeryPersonality>> = {
  famous: "LANDMARK",
  local: "HIDDEN_GEM",
  sns: "HOT_PLACE",
  classic: "HERITAGE",
};

export const USER_PREFERENCE_BAKERY_USE_TYPE_MAP: Partial<Record<string, BakeryUseType>> = {
  takeout: "TAKEOUT",
  cafe: "CAFE_STYLE",
  mood: "MOODY_SPACE",
  practical: "PRACTICAL",
};

export const USER_PREFERENCE_WAITING_MAP: Record<string, WaitingTolerance> = {
  "no-wait": "NO_WAIT",
  "10-20": "UNDER_20",
  "30": "UNDER_30",
  ok: "ANYTIME",
};

export const INITIAL_USER_PREFERENCE_QUESTIONS: PreferenceQuestion[] = [
  {
    id: "bread-style",
    title: "빵 스타일",
    allowMultiple: true,
    options: [
      { id: "plain", label: "담백한 빵" },
      { id: "dessert", label: "달달한 디저트" },
      { id: "premium", label: "고급 베이커리" },
      { id: "traditional", label: "전통 스타일" },
      { id: "trendy", label: "요즘 핫한 메뉴" },
    ],
  },
  {
    id: "bakery-type",
    title: "빵집 성향",
    allowMultiple: true,
    options: [
      { id: "famous", label: "유명 맛집" },
      { id: "local", label: "동네 숨은 맛집" },
      { id: "sns", label: "SNS 핫플" },
      { id: "classic", label: "전통 빵집" },
    ],
  },
  {
    id: "store-preference",
    title: "선호 빵집 취향",
    allowMultiple: true,
    options: [
      { id: "takeout", label: "포장 위주" },
      { id: "cafe", label: "카페형" },
      { id: "mood", label: "SNS 감성" },
      { id: "practical", label: "실속형" },
    ],
  },
  {
    id: "waiting",
    title: "웨이팅 허용도",
    allowMultiple: false,
    hideSelectionHint: true,
    options: [
      { id: "no-wait", label: "웨이팅 싫음" },
      { id: "10-20", label: "10~20분 가능" },
      { id: "30", label: "30분 가능" },
      { id: "ok", label: "상관 없음" },
    ],
  },
];

/** GET /users/preference 응답을 설문 UI 상태로 변환합니다. */
export function hydrateQuestionsFromMyPreference(
  preference: MyPreferenceResponse,
): PreferenceQuestion[] {
  const typeIdSet = new Set(
    Object.entries(USER_PREFERENCE_BAKERY_TYPE_MAP)
      .filter(([, value]) => value && preference.bakeryTypes.includes(value))
      .map(([id]) => id),
  );
  const personalityIdSet = new Set(
    Object.entries(USER_PREFERENCE_BAKERY_PERSONALITY_MAP)
      .filter(([, value]) => value && preference.bakeryPersonalities.includes(value))
      .map(([id]) => id),
  );
  const useTypeIdSet = new Set(
    Object.entries(USER_PREFERENCE_BAKERY_USE_TYPE_MAP)
      .filter(([, value]) => value && preference.bakeryUseTypes.includes(value))
      .map(([id]) => id),
  );
  const waitingId = Object.entries(USER_PREFERENCE_WAITING_MAP).find(
    ([, value]) => value === preference.waitingTolerance,
  )?.[0];

  return INITIAL_USER_PREFERENCE_QUESTIONS.map((question) => {
    if (question.id === "bread-style") {
      return {
        ...question,
        options: question.options.map((option) => ({
          ...option,
          selected: typeIdSet.has(option.id),
        })),
      };
    }
    if (question.id === "bakery-type") {
      return {
        ...question,
        options: question.options.map((option) => ({
          ...option,
          selected: personalityIdSet.has(option.id),
        })),
      };
    }
    if (question.id === "store-preference") {
      return {
        ...question,
        options: question.options.map((option) => ({
          ...option,
          selected: useTypeIdSet.has(option.id),
        })),
      };
    }
    if (question.id === "waiting") {
      return {
        ...question,
        options: question.options.map((option) => ({
          ...option,
          selected: option.id === waitingId,
        })),
      };
    }
    return question;
  });
}

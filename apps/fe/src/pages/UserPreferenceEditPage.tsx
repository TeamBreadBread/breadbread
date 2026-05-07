import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@/api/types/common";
import {
  getMyPreference,
  updateMyPreference,
  type BakeryPersonality,
  type BakeryType,
  type BakeryUseType,
  type WaitingTolerance,
} from "@/api/user";
import { AppTopBar, BottomDoubleCTA } from "@/components/common";
import { PreferenceOptionCard } from "@/components/common/cards";
import PreferenceIntroSection from "@/components/domain/ai-course/PreferenceIntroSection";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import MobileFrame from "@/components/layout/MobileFrame";
import type { PreferenceQuestion } from "@/components/domain/ai-course/types";

const BAKERY_TYPE_MAP: Partial<Record<string, BakeryType>> = {
  plain: "PLAIN",
  dessert: "DESSERT",
  premium: "GOURMET",
  traditional: "CLASSIC",
  trendy: "TRENDY",
};

const BAKERY_PERSONALITY_MAP: Partial<Record<string, BakeryPersonality>> = {
  famous: "LANDMARK",
  local: "HIDDEN_GEM",
  sns: "HOT_PLACE",
  classic: "HERITAGE",
};

const BAKERY_USE_TYPE_MAP: Partial<Record<string, BakeryUseType>> = {
  takeout: "TAKEOUT",
  cafe: "CAFE_STYLE",
  mood: "MOODY_SPACE",
  practical: "PRACTICAL",
};

const WAITING_MAP: Record<string, WaitingTolerance> = {
  "no-wait": "NO_WAIT",
  "10-20": "UNDER_20",
  "30": "UNDER_30",
  ok: "ANYTIME",
};

const initialQuestions: PreferenceQuestion[] = [
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

type PreferenceSnapshot = {
  bakeryTypes: BakeryType[];
  bakeryPersonalities: BakeryPersonality[];
  bakeryUseTypes: BakeryUseType[];
  waitingTolerance: WaitingTolerance | null;
};

function sortUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

export default function UserPreferenceEditPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(initialQuestions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalSnapshot, setOriginalSnapshot] = useState<PreferenceSnapshot | null>(null);

  const handleToggleOption = (questionId: string, optionId: string) => {
    setQuestions((prevQuestions) =>
      prevQuestions.map((question) => {
        if (question.id !== questionId) return question;

        if (question.allowMultiple) {
          return {
            ...question,
            options: question.options.map((option) =>
              option.id === optionId ? { ...option, selected: !option.selected } : option,
            ),
          };
        }

        const tapped = question.options.find((option) => option.id === optionId);
        if (tapped?.selected) {
          return {
            ...question,
            options: question.options.map((option) => ({ ...option, selected: false })),
          };
        }

        return {
          ...question,
          options: question.options.map((option) => ({
            ...option,
            selected: option.id === optionId,
          })),
        };
      }),
    );
  };

  const getSelectedOptionIds = (questionId: string): string[] =>
    questions
      .find((question) => question.id === questionId)
      ?.options.filter((option) => option.selected)
      .map((option) => option.id) ?? [];

  const mapByTable = <T extends string>(
    selectedIds: string[],
    table: Partial<Record<string, T>>,
  ): T[] =>
    selectedIds.reduce<T[]>((acc, id) => {
      const mapped = table[id];
      if (mapped) acc.push(mapped);
      return acc;
    }, []);

  const currentSnapshot = useMemo<PreferenceSnapshot>(() => {
    const bakeryTypes = sortUnique(
      mapByTable(getSelectedOptionIds("bread-style"), BAKERY_TYPE_MAP),
    );
    const bakeryPersonalities = sortUnique(
      mapByTable(getSelectedOptionIds("bakery-type"), BAKERY_PERSONALITY_MAP),
    );
    const bakeryUseTypes = sortUnique(
      mapByTable(getSelectedOptionIds("store-preference"), BAKERY_USE_TYPE_MAP),
    );
    const waitingSelected = getSelectedOptionIds("waiting")[0];
    const waitingTolerance = waitingSelected ? WAITING_MAP[waitingSelected] : null;
    return { bakeryTypes, bakeryPersonalities, bakeryUseTypes, waitingTolerance };
  }, [questions]);

  const allQuestionsAnswered = questions.every((question) =>
    question.options.some((option) => option.selected),
  );

  const hasChanges = useMemo(() => {
    if (!originalSnapshot) return false;
    return JSON.stringify(currentSnapshot) !== JSON.stringify(originalSnapshot);
  }, [currentSnapshot, originalSnapshot]);

  useEffect(() => {
    let mounted = true;
    const loadMyPreference = async () => {
      try {
        setIsLoading(true);
        const preference = await getMyPreference();
        if (!mounted) return;

        const typeIdSet = new Set(
          Object.entries(BAKERY_TYPE_MAP)
            .filter(([, value]) => value && preference.bakeryTypes.includes(value))
            .map(([id]) => id),
        );
        const personalityIdSet = new Set(
          Object.entries(BAKERY_PERSONALITY_MAP)
            .filter(([, value]) => value && preference.bakeryPersonalities.includes(value))
            .map(([id]) => id),
        );
        const useTypeIdSet = new Set(
          Object.entries(BAKERY_USE_TYPE_MAP)
            .filter(([, value]) => value && preference.bakeryUseTypes.includes(value))
            .map(([id]) => id),
        );
        const waitingId = Object.entries(WAITING_MAP).find(
          ([, value]) => value === preference.waitingTolerance,
        )?.[0];

        setQuestions((prev) =>
          prev.map((question) => {
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
          }),
        );

        setOriginalSnapshot({
          bakeryTypes: sortUnique(preference.bakeryTypes ?? []),
          bakeryPersonalities: sortUnique(preference.bakeryPersonalities ?? []),
          bakeryUseTypes: sortUnique(preference.bakeryUseTypes ?? []),
          waitingTolerance: preference.waitingTolerance ?? null,
        });
      } catch (error) {
        window.alert(getErrorMessage(error));
        navigate({ to: "/my" });
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void loadMyPreference();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const handleSubmit = async () => {
    if (!allQuestionsAnswered || !hasChanges || isSubmitting || !currentSnapshot.waitingTolerance)
      return;
    try {
      setIsSubmitting(true);
      await updateMyPreference({
        bakeryTypes: currentSnapshot.bakeryTypes,
        bakeryPersonalities: currentSnapshot.bakeryPersonalities,
        bakeryUseTypes: currentSnapshot.bakeryUseTypes,
        waitingTolerance: currentSnapshot.waitingTolerance,
      });
      window.alert("수정을 완료했습니다.");
      navigate({ to: "/my" });
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileFrame>
      <div className="pb-footer-safe flex flex-1 flex-col bg-white">
        <AppTopBar title="내 선호도 수정" onBack={() => navigate({ to: "/my" })} />

        {isLoading ? (
          <p className="px-x5 py-x3 text-size-4 text-gray-700">내 선호도 불러오는 중...</p>
        ) : null}

        <PreferenceIntroSection title={"현재 선호도를 수정해 주세요"} description="설명 문구" />

        <div className="flex flex-col gap-x2_5">
          {questions.map((question) => {
            const helperText = question.hideSelectionHint
              ? ""
              : question.allowMultiple
                ? "중복 가능"
                : "1개 선택";
            return (
              <PreferenceQuestionSection
                key={question.id}
                title={question.title}
                helperText={helperText}
              >
                {question.options.map((option) => (
                  <PreferenceOptionCard
                    key={option.id}
                    label={option.label}
                    selected={option.selected}
                    onClick={() => handleToggleOption(question.id, option.id)}
                  />
                ))}
              </PreferenceQuestionSection>
            );
          })}
        </div>
      </div>

      <BottomDoubleCTA
        placement="fixed"
        leftText="취소하기"
        rightText={isSubmitting ? "저장 중..." : "수정하기"}
        rightDisabled={isLoading || !allQuestionsAnswered || !hasChanges || isSubmitting}
        onLeftClick={() => navigate({ to: "/my" })}
        onRightClick={handleSubmit}
      />
    </MobileFrame>
  );
}

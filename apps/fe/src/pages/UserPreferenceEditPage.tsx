import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ApiBusinessError, getErrorMessage } from "@/api/types/common";
import {
  getMyPreference,
  savePreference,
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
import { invalidatePreferenceOnboardingCache } from "@/lib/auth/preferenceOnboardingGate";
import {
  hydrateQuestionsFromMyPreference,
  INITIAL_USER_PREFERENCE_QUESTIONS,
  normalizeMyPreference,
  USER_PREFERENCE_BAKERY_PERSONALITY_MAP as BAKERY_PERSONALITY_MAP,
  USER_PREFERENCE_BAKERY_TYPE_MAP as BAKERY_TYPE_MAP,
  USER_PREFERENCE_BAKERY_USE_TYPE_MAP as BAKERY_USE_TYPE_MAP,
  USER_PREFERENCE_WAITING_MAP as WAITING_MAP,
} from "@/lib/userPreferenceHydrate";

type PreferenceSnapshot = {
  bakeryTypes: BakeryType[];
  bakeryPersonalities: BakeryPersonality[];
  bakeryUseTypes: BakeryUseType[];
  waitingTolerance: WaitingTolerance | null;
};

function sortUnique<T extends string>(values: T[]): T[] {
  return [...new Set(values)].sort();
}

function isMissingPreferenceError(error: unknown): boolean {
  return (
    error instanceof ApiBusinessError &&
    (error.code === "E0403" ||
      error.status === 404 ||
      /선호도 조사 결과가 없습니다/.test(error.message ?? ""))
  );
}

export default function UserPreferenceEditPage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<PreferenceQuestion[]>(
    INITIAL_USER_PREFERENCE_QUESTIONS,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [originalSnapshot, setOriginalSnapshot] = useState<PreferenceSnapshot | null>(null);
  const [hasExistingPreference, setHasExistingPreference] = useState(true);

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

  const getSelectedOptionIds = useCallback(
    (questionId: string): string[] =>
      questions
        .find((question) => question.id === questionId)
        ?.options.filter((option) => option.selected)
        .map((option) => option.id) ?? [],
    [questions],
  );

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
  }, [getSelectedOptionIds]);

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
        const rawPreference = await getMyPreference();
        if (!mounted) return;
        if (!rawPreference) {
          setHasExistingPreference(false);
          setQuestions(INITIAL_USER_PREFERENCE_QUESTIONS);
          setOriginalSnapshot({
            bakeryTypes: [],
            bakeryPersonalities: [],
            bakeryUseTypes: [],
            waitingTolerance: null,
          });
          return;
        }
        const preference = normalizeMyPreference(rawPreference);

        setHasExistingPreference(true);
        setQuestions(hydrateQuestionsFromMyPreference(preference));

        setOriginalSnapshot({
          bakeryTypes: sortUnique(preference.bakeryTypes ?? []),
          bakeryPersonalities: sortUnique(preference.bakeryPersonalities ?? []),
          bakeryUseTypes: sortUnique(preference.bakeryUseTypes ?? []),
          waitingTolerance: preference.waitingTolerance ?? null,
        });
      } catch (error) {
        if (isMissingPreferenceError(error)) {
          if (!mounted) return;
          setHasExistingPreference(false);
          setQuestions(INITIAL_USER_PREFERENCE_QUESTIONS);
          setOriginalSnapshot({
            bakeryTypes: [],
            bakeryPersonalities: [],
            bakeryUseTypes: [],
            waitingTolerance: null,
          });
          return;
        }
        if (!mounted) return;
        // 네트워크/서버 오류 시에도 페이지를 유지해서 "진입 즉시 튕김"을 막습니다.
        window.alert(getErrorMessage(error));
        setHasExistingPreference(false);
        setQuestions(INITIAL_USER_PREFERENCE_QUESTIONS);
        setOriginalSnapshot({
          bakeryTypes: [],
          bakeryPersonalities: [],
          bakeryUseTypes: [],
          waitingTolerance: null,
        });
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
      const payload = {
        bakeryTypes: currentSnapshot.bakeryTypes,
        bakeryPersonalities: currentSnapshot.bakeryPersonalities,
        bakeryUseTypes: currentSnapshot.bakeryUseTypes,
        waitingTolerance: currentSnapshot.waitingTolerance,
      };

      if (hasExistingPreference) {
        try {
          await updateMyPreference(payload);
          window.alert("수정을 완료했습니다.");
        } catch (error) {
          if (!isMissingPreferenceError(error)) throw error;
          await savePreference(payload);
          window.alert("선호도를 저장했습니다.");
        }
      } else {
        await savePreference(payload);
        window.alert("선호도를 저장했습니다.");
      }
      invalidatePreferenceOnboardingCache();
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

        <PreferenceIntroSection
          title={
            hasExistingPreference ? "현재 선호도를 수정해 주세요" : "선호도를 먼저 선택해 주세요"
          }
        />

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
        rightText={isSubmitting ? "저장 중..." : hasExistingPreference ? "수정하기" : "저장하기"}
        rightDisabled={isLoading || !allQuestionsAnswered || !hasChanges || isSubmitting}
        onLeftClick={() => navigate({ to: "/my" })}
        onRightClick={handleSubmit}
      />
    </MobileFrame>
  );
}

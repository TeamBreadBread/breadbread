import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { ApiBusinessError, getErrorMessage } from "@/api/types/common";
import { getMyPreference, savePreference, updateMyPreference } from "@/api/user";
import { AppTopBar, BottomDoubleCTA } from "@/components/common";
import { PreferenceOptionCard } from "@/components/common/cards";
import PreferenceIntroSection from "@/components/domain/ai-course/PreferenceIntroSection";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import MobileFrame from "@/components/layout/MobileFrame";
import type { PreferenceQuestion } from "@/components/domain/ai-course/types";
import {
  hydrateQuestionsFromMyPreference,
  INITIAL_USER_PREFERENCE_QUESTIONS,
  USER_PREFERENCE_BAKERY_PERSONALITY_MAP as BAKERY_PERSONALITY_MAP,
  USER_PREFERENCE_BAKERY_TYPE_MAP as BAKERY_TYPE_MAP,
  USER_PREFERENCE_BAKERY_USE_TYPE_MAP as BAKERY_USE_TYPE_MAP,
  USER_PREFERENCE_WAITING_MAP as WAITING_MAP,
} from "@/lib/userPreferenceHydrate";

type BreadPreferencePageProps = {
  isEditMode?: boolean;
};

export default function BreadPreferencePage({ isEditMode = false }: BreadPreferencePageProps) {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<PreferenceQuestion[]>(
    INITIAL_USER_PREFERENCE_QUESTIONS,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPreference, setIsLoadingPreference] = useState(false);

  const allQuestionsAnswered = questions.every((question) =>
    question.options.some((option) => option.selected),
  );

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
        // Same chip again clears selection so only 다른 옵션 is not needed to 해제.
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

  const dedupe = <T extends string>(values: T[]): T[] => [...new Set(values)];

  useEffect(() => {
    if (!isEditMode) return;
    let mounted = true;
    const loadMyPreference = async () => {
      try {
        setIsLoadingPreference(true);
        const preference = await getMyPreference();
        if (!mounted) return;

        setQuestions(hydrateQuestionsFromMyPreference(preference));
      } catch {
        // no preference yet: keep empty selections
      } finally {
        if (mounted) setIsLoadingPreference(false);
      }
    };
    void loadMyPreference();
    return () => {
      mounted = false;
    };
  }, [isEditMode]);

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!allQuestionsAnswered) {
      window.alert("모든 항목을 선택해 주세요.");
      return;
    }

    const bakeryTypes = dedupe(mapByTable(getSelectedOptionIds("bread-style"), BAKERY_TYPE_MAP));
    const bakeryPersonalities = dedupe(
      mapByTable(getSelectedOptionIds("bakery-type"), BAKERY_PERSONALITY_MAP),
    );
    const bakeryUseTypes = dedupe(
      mapByTable(getSelectedOptionIds("store-preference"), BAKERY_USE_TYPE_MAP),
    );
    const waitingSelected = getSelectedOptionIds("waiting");
    const waitingId = waitingSelected[0];
    const waitingTolerance = waitingId !== undefined ? WAITING_MAP[waitingId] : undefined;

    if (
      bakeryTypes.length === 0 ||
      bakeryPersonalities.length === 0 ||
      bakeryUseTypes.length === 0 ||
      !waitingTolerance
    ) {
      const invalidGroups: string[] = [];
      if (bakeryTypes.length === 0) invalidGroups.push("빵 스타일");
      if (bakeryPersonalities.length === 0) invalidGroups.push("빵집 성향");
      if (bakeryUseTypes.length === 0) invalidGroups.push("선호 빵집 취향");
      if (!waitingTolerance) invalidGroups.push("웨이팅 허용도");
      window.alert(
        `현재 선택은 API와 매핑되지 않습니다.\n다음 항목을 다시 선택해 주세요:\n- ${invalidGroups.join("\n- ")}`,
      );
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        bakeryTypes,
        bakeryPersonalities,
        bakeryUseTypes,
        waitingTolerance,
      };
      if (isEditMode) {
        await updateMyPreference(payload);
        window.alert("수정을 완료했습니다.");
      } else {
        try {
          await updateMyPreference(payload);
        } catch (error) {
          const preferenceMissing =
            error instanceof ApiBusinessError &&
            (error.code === "E0403" ||
              error.status === 404 ||
              /선호도 조사 결과가 없습니다/.test(error.message));
          if (preferenceMissing) {
            await savePreference(payload);
          } else {
            throw error;
          }
        }
      }
      navigate({ to: "/home" });
    } catch (error) {
      window.alert(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MobileFrame>
      <div className="pb-footer-safe flex flex-1 flex-col bg-white">
        <AppTopBar
          title={isEditMode ? "내 선호도 수정" : "선호도 조사"}
          onBack={() => navigate({ to: isEditMode ? "/my" : "/" })}
        />
        {isLoadingPreference ? (
          <p className="px-x5 py-x3 text-size-4 text-gray-700">내 선호도 불러오는 중...</p>
        ) : null}

        <PreferenceIntroSection
          title={
            isEditMode
              ? "현재 선호도를 수정해 주세요"
              : "정확한 빵 취향을 위해\n선호도 조사를 해주세요"
          }
          description="설명 문구"
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
        leftText={isEditMode ? "취소하기" : "건너뛰기"}
        rightText={isSubmitting ? "저장 중..." : isEditMode ? "수정 완료" : "완료"}
        rightDisabled={!allQuestionsAnswered || isSubmitting}
        onLeftClick={() => navigate({ to: isEditMode ? "/my" : "/home" })}
        onRightClick={handleSubmit}
      />
    </MobileFrame>
  );
}

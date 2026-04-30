import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getErrorMessage } from "@/api/types/common";
import {
  submitUserPreference,
  type UserPreferenceBakeryPersonality,
  type UserPreferenceBakeryType,
  type UserPreferenceBakeryUseType,
  type UserPreferenceWaitingTolerance,
} from "@/api/user";
import { AppTopBar, BottomDoubleCTA } from "@/components/common";
import { PreferenceOptionCard } from "@/components/common/cards";
import PreferenceIntroSection from "@/components/domain/ai-course/PreferenceIntroSection";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import MobileFrame from "@/components/layout/MobileFrame";
import type { PreferenceQuestion } from "@/components/domain/ai-course/types";

const BAKERY_TYPE_MAP: Partial<Record<string, UserPreferenceBakeryType>> = {
  plain: "PLAIN",
  dessert: "DESSERT",
  premium: "DESSERT",
  traditional: "PLAIN",
  trendy: "DESSERT",
};

const BAKERY_PERSONALITY_MAP: Partial<Record<string, UserPreferenceBakeryPersonality>> = {
  famous: "HIDDEN_GEM",
  local: "HIDDEN_GEM",
  sns: "HIDDEN_GEM",
  classic: "HERITAGE",
};

const BAKERY_USE_TYPE_MAP: Partial<Record<string, UserPreferenceBakeryUseType>> = {
  takeout: "TAKEOUT",
  cafe: "CAFE",
  mood: "CAFE",
  practical: "TAKEOUT",
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

export default function BreadPreferencePage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(initialQuestions);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!allQuestionsAnswered) {
      window.alert("모든 항목을 선택해 주세요.");
      return;
    }

    const bakeryTypes = mapByTable(getSelectedOptionIds("bread-style"), BAKERY_TYPE_MAP);
    const bakeryPersonalities = mapByTable(
      getSelectedOptionIds("bakery-type"),
      BAKERY_PERSONALITY_MAP,
    );
    const bakeryUseTypes = mapByTable(
      getSelectedOptionIds("store-preference"),
      BAKERY_USE_TYPE_MAP,
    );
    const waitingSelected = getSelectedOptionIds("waiting");

    // TODO: Swagger에는 waitingTolerance가 UNDER_20만 제공됩니다. 다른 UI 옵션은 명세 확정 후 매핑 필요.
    const waitingTolerance: UserPreferenceWaitingTolerance | undefined =
      waitingSelected.length > 0 ? "UNDER_20" : undefined;

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
      await submitUserPreference({
        bakeryTypes,
        bakeryPersonalities,
        bakeryUseTypes,
        waitingTolerance,
      });
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
        <AppTopBar title="선호도 조사" onBack={() => navigate({ to: "/" })} />

        <PreferenceIntroSection
          title={"정확한 빵 취향을 위해\n선호도 조사를 해주세요"}
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
        leftText="건너뛰기"
        rightText={isSubmitting ? "제출 중..." : "완료"}
        rightDisabled={!allQuestionsAnswered || isSubmitting}
        onLeftClick={() => navigate({ to: "/home" })}
        onRightClick={handleSubmit}
      />
    </MobileFrame>
  );
}

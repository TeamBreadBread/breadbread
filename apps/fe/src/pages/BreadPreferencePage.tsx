import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AppTopBar, BottomDoubleCTA } from "@/components/common";
import PreferenceIntroSection from "@/components/domain/ai-course/PreferenceIntroSection";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import MobileFrame from "@/components/layout/MobileFrame";
import type { PreferenceQuestion } from "@/components/domain/ai-course/types";

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
    allowMultiple: true,
    hideSelectionHint: true,
    options: [
      { id: "no-wait", label: "웨이팅 싫음" },
      { id: "ok", label: "상관 없음" },
      { id: "10-20", label: "10~20분 가능" },
      { id: "30", label: "30분 가능" },
    ],
  },
];

export default function BreadPreferencePage() {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState(initialQuestions);

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

  return (
    <MobileFrame>
      <div className="flex flex-1 flex-col bg-white">
        <AppTopBar title="선호도 조사" onBack={() => navigate({ to: "/" })} />

        <PreferenceIntroSection
          title={"정확한 빵 취향을 위해\n선호도 조사를 해주세요"}
          description="설명 문구"
        />

        <div className="flex flex-col gap-x2_5">
          {questions.map((question) => (
            <PreferenceQuestionSection
              key={question.id}
              question={question}
              onToggleOption={handleToggleOption}
            />
          ))}
        </div>
      </div>

      <BottomDoubleCTA leftText="건너뛰기" rightText="완료" />
    </MobileFrame>
  );
}

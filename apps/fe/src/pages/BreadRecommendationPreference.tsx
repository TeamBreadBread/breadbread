// 사용자의 선택지를 섹션별로 관리하고,
// 선택 결과를 기반으로 다음 페이지로 이동시키는 화면

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import { Button } from "@/components/common";
import RecommendationIconAsset from "@/assets/icons/StarCTA.svg";
import PreferenceIntro from "@/components/domain/ai-course/PreferenceIntro";
import PreferenceOptionCard from "@/components/common/cards/PreferenceOptionCard";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import PreferenceTopBar from "@/components/domain/ai-course/PreferenceTopBar";
import RecommendationCTAButton from "@/components/domain/ai-course/RecommendationCTAButton";
import RecommendationCountStepper from "@/components/domain/ai-course/RecommendationCountStepper";
import { sectionAllowsMultipleChoice } from "@/utils/preferenceSelection";
import { cn } from "@/utils/cn";

type OptionItem = {
  label: string;
  withIcon?: boolean;
  /** 선택 상태용 고유값(라벨이 같을 때) */
  value?: string;
};

type QuestionItem = {
  id: string;
  title: string;
  helperText?: string;
  /** 명시하면 helper 문자열보다 우선 (BreadPreferencePage.allowMultiple 과 동일 개념) */
  allowMultiple?: boolean;
  columns?: 1 | 2;
  options: OptionItem[];
};

const QUESTION_SECTIONS: QuestionItem[] = [
  {
    id: "breadType",
    title: "어떤 빵을 좋아하시나요?",
    helperText: "중복 가능",
    allowMultiple: true,
    columns: 2,
    options: [
      { label: "빵", withIcon: true },
      { label: "샌드위치", withIcon: true },
      { label: "케이크", withIcon: true },
      { label: "떡", withIcon: true },
      { label: "쿠키", withIcon: true },
      { label: "다이어트 빵", withIcon: true },
    ],
  },
  {
    id: "waiting",
    title: "웨이팅이 있어도 괜찮으신가요?",
    helperText: "",
    columns: 1,
    options: [{ label: "괜찮아요" }, { label: "피하고 싶어요" }],
  },
  {
    id: "drink",
    title: "음료수 ~~~시나요?",
    helperText: "",
    columns: 1,
    options: [
      { label: "ㅇㅇㅇㅇㅇ", value: "drink-0" },
      { label: "ㅇㅇㅇㅇㅇ", value: "drink-1" },
    ],
  },
  {
    id: "count",
    title: "총 몇 개의 빵집을 추천받고 싶으신가요?",
    helperText: "",
    columns: 1,
    options: [],
  },
  {
    id: "courseChangePreference",
    title: "실시간 상황(품절 등)에 따른 AI의 코스 변경 제안을 얼마나 적극적으로 할까요?",
    helperText: "",
    columns: 1,
    options: [
      { label: "최초 계획을 최대한 유지" },
      { label: "상황 변동 시 적극적으로 제안" },
      { label: "품절 시에만 제안" },
    ],
  },
];

type SelectedBySection = Record<string, string[]>;

const BREAD_TYPE_SECTION_ID = "breadType";

/** breadType 제외·카드로 반드시 골라야 하는 섹션(count는 스테퍼 기본값) */
const REQUIRED_CARD_SECTION_IDS = ["waiting", "drink", "courseChangePreference"] as const;

function CircleIcon() {
  return <div className="h-x14 w-x14 rounded-full bg-gray-400" />;
}

function RecommendationIcon() {
  return <img src={RecommendationIconAsset} alt="" aria-hidden="true" className="h-x6 w-x6" />;
}

export default function BreadRecommendationPreference() {
  const [selectedBySection, setSelectedBySection] = useState<SelectedBySection>({});
  const [recommendationCount, setRecommendationCount] = useState(1);
  const navigate = useNavigate();

  const handleSelect = (sectionId: string, optionValue: string) => {
    setSelectedBySection((prev) => {
      const current = prev[sectionId] ?? [];
      const isSelected = current.includes(optionValue);
      const section = QUESTION_SECTIONS.find((s) => s.id === sectionId);
      const allowsMultiple = section ? sectionAllowsMultipleChoice(section) : false;

      let nextSectionValues: string[];
      if (allowsMultiple) {
        nextSectionValues = isSelected
          ? current.filter((selectedOption) => selectedOption !== optionValue)
          : [...current, optionValue];
      } else {
        nextSectionValues = isSelected ? current : [optionValue];
      }

      return {
        ...prev,
        [sectionId]: nextSectionValues,
      };
    });
  };

  const canSubmitRecommendation =
    (selectedBySection[BREAD_TYPE_SECTION_ID]?.length ?? 0) > 0 &&
    REQUIRED_CARD_SECTION_IDS.every((id) => (selectedBySection[id]?.length ?? 0) > 0);

  return (
    <MobileFrame>
      <div className="pb-footer-safe flex flex-1 flex-col bg-gray-00">
        <PreferenceTopBar
          title="빵 취향 선택"
          onBack={() => navigate({ to: "/preference" })}
          onCancel={() => navigate({ to: "/home" })}
        />

        <PreferenceIntro
          currentStep={2}
          totalStep={2}
          title="원하는 빵집을 선택해주세요"
          description="설명 문구"
        />

        <div className="flex flex-col gap-0">
          {QUESTION_SECTIONS.map((section) => (
            <PreferenceQuestionSection
              key={section.id}
              title={section.title}
              helperText={section.helperText}
              columns={section.columns}
              icon={
                section.id === "count" ? (
                  <div className="flex flex-row items-center justify-start p-[3px]">
                    <div className="h-[18px] w-[18px] shrink-0 rounded-full bg-[#dcdee3]" />
                  </div>
                ) : undefined
              }
            >
              {section.id === "count" ? (
                <RecommendationCountStepper
                  value={recommendationCount}
                  onChange={setRecommendationCount}
                />
              ) : (
                section.options.map((option, optionIndex) => {
                  const optionValue = option.value ?? option.label;
                  return (
                    <PreferenceOptionCard
                      key={`${section.id}-${optionValue}-${optionIndex}`}
                      label={option.label}
                      selected={selectedBySection[section.id]?.includes(optionValue) ?? false}
                      onClick={() => handleSelect(section.id, optionValue)}
                      icon={option.withIcon ? <CircleIcon /> : undefined}
                    />
                  );
                })
              )}
            </PreferenceQuestionSection>
          ))}
        </div>
      </div>

      <div
        className={cn("fixed bottom-0 left-1/2 z-20 w-full max-w-x186 -translate-x-1/2 bg-gray-00")}
      >
        <div className="h-x12 bg-gradient-to-b from-transparent to-gray-00" />

        <div
          className={cn(
            "flex items-start justify-center gap-[10px] overflow-hidden",
            "mt-x3 border-t border-gray-300 bg-gray-00 px-[20px] pb-[max(12px,env(safe-area-inset-bottom))] pt-x3",
          )}
        >
          <Button
            variant="secondary"
            fullWidth
            className="max-w-x80"
            onClick={() => navigate({ to: "/preference" })}
          >
            이전
          </Button>

          <RecommendationCTAButton
            icon={<RecommendationIcon />}
            disabled={!canSubmitRecommendation}
            onClick={() => navigate({ to: "/ai-search-result" })}
          >
            추천 받기
          </RecommendationCTAButton>
        </div>
      </div>
    </MobileFrame>
  );
}

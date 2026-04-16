// 사용자의 선택지를 섹션별로 관리하고,
// 선택 결과를 기반으로 다음 페이지로 이동시키는 화면

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import { Button } from "@/components/common";
import RecommendationIconAsset from "@/assets/icons/Star.svg";
import PreferenceIntro from "@/components/domain/ai-course/PreferenceIntro";
import PreferenceOptionCard from "@/components/common/cards/PreferenceOptionCard";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import PreferenceTopBar from "@/components/domain/ai-course/PreferenceTopBar";
import RecommendationCTAButton from "@/components/domain/ai-course/RecommendationCTAButton";
import RecommendationCountStepper from "@/components/domain/ai-course/RecommendationCountStepper";
import { cn } from "@/utils/cn";

type OptionItem = {
  label: string;
  withIcon?: boolean;
};

type QuestionItem = {
  id: string;
  title: string;
  helperText?: string;
  columns?: 1 | 2;
  options: OptionItem[];
};

const QUESTION_SECTIONS: QuestionItem[] = [
  {
    id: "breadType",
    title: "어떤 빵을 좋아하시나요?",
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
    columns: 1,
    options: [{ label: "괜찮아요" }, { label: "피하고 싶어요" }],
  },
  {
    id: "drink",
    title: "음료수 ~~~시나요?",
    columns: 1,
    options: [{ label: "ㅇㅇㅇㅇㅇ" }, { label: "ㅇㅇㅇㅇㅇ" }],
  },
  {
    id: "count",
    title: "총 몇 개의 빵집을 추천받고 싶으신가요?",
    helperText: "",
    columns: 1,
    options: [],
  },
];

type SelectedBySection = Record<string, string[]>;

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

  const handleSelect = (sectionId: string, optionLabel: string) => {
    setSelectedBySection((prev) => {
      const current = prev[sectionId] ?? [];
      const isSelected = current.includes(optionLabel);

      return {
        ...prev,
        [sectionId]: isSelected
          ? current.filter((selectedOption) => selectedOption !== optionLabel)
          : [...current, optionLabel],
      };
    });
  };

  return (
    <MobileFrame>
      <div className="pb-footer-safe flex flex-1 flex-col">
        <PreferenceTopBar title="빵 취향 선택" />

        <PreferenceIntro
          currentStep={2}
          totalStep={2}
          title="원하는 빵집을 선택해주세요"
          description="설명 문구"
        />

        <div className="flex flex-col gap-x2-5">
          {QUESTION_SECTIONS.map((section) => (
            <PreferenceQuestionSection
              key={section.id}
              title={section.title}
              helperText={section.helperText}
              columns={section.columns}
            >
              {section.id === "count" ? (
                <RecommendationCountStepper
                  value={recommendationCount}
                  onChange={setRecommendationCount}
                />
              ) : (
                section.options.map((option, optionIndex) => (
                  <PreferenceOptionCard
                    key={`${section.id}-${option.label}-${optionIndex}`}
                    label={option.label}
                    selected={selectedBySection[section.id]?.includes(option.label) ?? false}
                    onClick={() => handleSelect(section.id, option.label)}
                    icon={option.withIcon ? <CircleIcon /> : undefined}
                  />
                ))
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
            "flex items-start justify-center gap-x2-5 overflow-hidden",
            "mt-x3 border-t border-gray-300 bg-gray-00 px-x5 py-x3",
          )}
        >
          <Button
            variant="secondary"
            fullWidth
            className="max-w-x80"
            onClick={() => navigate({ to: "/" })}
          >
            이전
          </Button>

          <RecommendationCTAButton
            icon={<RecommendationIcon />}
            onClick={() => navigate({ to: "/" })}
          >
            추천 받기
          </RecommendationCTAButton>
        </div>
      </div>
    </MobileFrame>
  );
}

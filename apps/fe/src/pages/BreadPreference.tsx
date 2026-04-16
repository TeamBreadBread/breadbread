import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import { OverlayFooter } from "@/components/common";
import { PreferenceOptionCard } from "@/components/common/cards";
import PreferenceIntro from "@/components/domain/ai-course/PreferenceIntro";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import PreferenceTopBar from "@/components/domain/ai-course/PreferenceTopBar";

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
    id: "companion",
    title: "누구와 함께 하시나요?",
    options: [
      { label: "혼자", withIcon: true },
      { label: "커플", withIcon: true },
      { label: "친구", withIcon: true },
      { label: "가족", withIcon: true },
    ],
  },
  {
    id: "budget",
    title: "예산이 어떻게 되시나요?",
    options: [
      { label: "2만원 이하" },
      { label: "2 - 4만원" },
      { label: "4만원 이상" },
      { label: "상관없어요" },
    ],
  },
  {
    id: "route",
    title: "코스 동선을 최소화 해드릴까요?",
    columns: 1,
    options: [{ label: "최소화해주세요" }, { label: "상관없어요" }],
  },
];

type SelectedBySection = Record<string, string[]>;

function CircleIcon() {
  return <div className="h-x14 w-x14 rounded-full bg-gray-400" />;
}

export default function BreadPreference() {
  const [selectedBySection, setSelectedBySection] = useState<SelectedBySection>({});
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
          currentStep={1}
          totalStep={2}
          title="원하는 투어를 선택해주세요"
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
              {section.options.map((option) => (
                <PreferenceOptionCard
                  key={`${section.title}-${option.label}`}
                  label={option.label}
                  selected={selectedBySection[section.id]?.includes(option.label) ?? false}
                  onClick={() => handleSelect(section.id, option.label)}
                  icon={option.withIcon ? <CircleIcon /> : undefined}
                />
              ))}
            </PreferenceQuestionSection>
          ))}
        </div>
      </div>

      <OverlayFooter onRightClick={() => navigate({ to: "/recommendation" })} />
    </MobileFrame>
  );
}

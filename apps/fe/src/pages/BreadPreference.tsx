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
  const [isDepartureChecked, setIsDepartureChecked] = useState(false);
  const [isDepartureBottomSheetOpen, setIsDepartureBottomSheetOpen] = useState(false);
  const [departureKeyword, setDepartureKeyword] = useState("");
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

  const handleDepartureCheckClick = () => {
    setIsDepartureChecked((prev) => {
      const next = !prev;
      setIsDepartureBottomSheetOpen(next);
      return next;
    });
  };

  const openDepartureBottomSheet = () => {
    setIsDepartureChecked(true);
    setIsDepartureBottomSheetOpen(true);
  };

  const closeDepartureBottomSheet = () => {
    setIsDepartureBottomSheetOpen(false);
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

          <PreferenceQuestionSection
            title={isDepartureChecked ? "출발지 검색" : "출발지를 입력해주세요"}
            helperText=""
            columns={1}
          >
            <div className="w-full">
              <div
                role="button"
                tabIndex={0}
                aria-label="출발지 입력창 열기"
                className="mx-auto flex h-[64px] w-full max-w-[362px] items-center justify-between rounded-r3 border border-gray-500 px-x4"
                onClick={openDepartureBottomSheet}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openDepartureBottomSheet();
                  }
                }}
              >
                <button
                  type="button"
                  aria-label="출발지 입력 확인"
                  className="flex h-x6 w-x6 items-center justify-center rounded-full border border-gray-500 text-size-4 text-gray-500"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDepartureCheckClick();
                  }}
                >
                  ✓
                </button>

                <input
                  readOnly
                  value={departureKeyword || "출발지 입력"}
                  className="mx-x3 flex-1 bg-transparent text-left font-sans text-size-5 leading-t6 font-normal tracking-1 text-gray-500 outline-none"
                />

                <span
                  aria-hidden="true"
                  className="flex h-x6 w-x6 items-center justify-center text-size-4 text-gray-500"
                >
                  ⌕
                </span>
              </div>
            </div>
          </PreferenceQuestionSection>
        </div>
      </div>

      {isDepartureBottomSheetOpen ? (
        <>
          <button
            type="button"
            aria-label="출발지 검색 바텀시트 닫기"
            className="fixed inset-y-0 left-1/2 z-30 w-full max-w-x186 -translate-x-1/2 bg-black/40"
            onClick={closeDepartureBottomSheet}
          />
          <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-x186 -translate-x-1/2 rounded-t-r3 bg-gray-00 px-x5 py-x5">
            <button
              type="button"
              aria-label="출발지 검색 바텀시트 닫기"
              className="mx-auto mb-x4 block h-[4px] w-[36px] rounded-full bg-gray-400"
              onClick={closeDepartureBottomSheet}
            />
            <h3 className="font-sans text-size-7 font-bold leading-t8 tracking-[-0.2px] text-gray-1000">
              출발지 검색
            </h3>
            <div className="mt-x4 flex h-[64px] items-center justify-between rounded-r3 border border-gray-500 px-x4">
              <input
                value={departureKeyword}
                onChange={(event) => setDepartureKeyword(event.target.value)}
                placeholder="placeholder"
                className="flex-1 bg-transparent font-sans text-size-5 leading-t6 font-normal tracking-1 text-gray-1000 outline-none placeholder:text-gray-500"
              />
              <button
                type="button"
                aria-label="출발지 검색 완료"
                className="ml-x3 flex h-x6 w-x6 items-center justify-center text-size-4 text-gray-500"
                onClick={closeDepartureBottomSheet}
              >
                ⌕
              </button>
            </div>
          </div>
        </>
      ) : null}

      <OverlayFooter onRightClick={() => navigate({ to: "/recommendation" })} />
    </MobileFrame>
  );
}

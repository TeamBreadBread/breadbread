import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import MobileFrame from "@/components/layout/MobileFrame";
import { OverlayFooter } from "@/components/common";
import { PreferenceOptionCard } from "@/components/common/cards";
import PreferenceIntro from "@/components/domain/ai-course/PreferenceIntro";
import PreferenceQuestionSection from "@/components/domain/ai-course/PreferenceQuestionSection";
import PreferenceTopBar from "@/components/domain/ai-course/PreferenceTopBar";
import { sectionAllowsMultipleChoice } from "@/utils/preferenceSelection";
import { cn } from "@/utils/cn";

type OptionItem = {
  label: string;
  withIcon?: boolean;
};

type QuestionItem = {
  id: string;
  title: string;
  helperText?: string;
  /** 명시하면 helperText보다 우선 */
  allowMultiple?: boolean;
  columns?: 1 | 2;
  options: OptionItem[];
};

const QUESTION_SECTIONS: QuestionItem[] = [
  {
    id: "companion",
    title: "누구와 함께 하시나요?",
    helperText: "",
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
    helperText: "",
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
    helperText: "",
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
  const [searchKeyword, setSearchKeyword] = useState("");
  const navigate = useNavigate();

  const handleSelect = (sectionId: string, optionLabel: string) => {
    setSelectedBySection((prev) => {
      const current = prev[sectionId] ?? [];
      const isSelected = current.includes(optionLabel);
      const section = QUESTION_SECTIONS.find((s) => s.id === sectionId);
      const allowsMultiple = section ? sectionAllowsMultipleChoice(section) : false;

      let nextSectionValues: string[];
      if (allowsMultiple) {
        nextSectionValues = isSelected
          ? current.filter((selectedOption) => selectedOption !== optionLabel)
          : [...current, optionLabel];
      } else {
        nextSectionValues = isSelected ? [] : [optionLabel];
      }

      return {
        ...prev,
        [sectionId]: nextSectionValues,
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
    setSearchKeyword(departureKeyword);
    setIsDepartureBottomSheetOpen(true);
  };

  const closeDepartureBottomSheet = () => {
    setIsDepartureBottomSheetOpen(false);
  };

  const isSungsimdangSearch = searchKeyword.trim() === "성심당";
  const hasDepartureResult = departureKeyword.trim().length > 0;
  const listTitle = isSungsimdangSearch ? "검색 결과" : "최근 검색어";
  const resultItems = isSungsimdangSearch
    ? ["성심당 본점", "성심당 부띠끄", "성심당 DCC점"]
    : ["검색어 1", "검색어 2", "검색어 3"];

  const handleSearchSubmit = () => {
    const trimmed = searchKeyword.trim();
    setDepartureKeyword(trimmed);
    closeDepartureBottomSheet();
  };

  const handleResultItemClick = (item: string) => {
    setDepartureKeyword(item);
    setSearchKeyword(item);
    closeDepartureBottomSheet();
  };

  const allQuestionSectionsAnswered = QUESTION_SECTIONS.every(
    (section) => (selectedBySection[section.id]?.length ?? 0) > 0,
  );
  const canGoNext = allQuestionSectionsAnswered && hasDepartureResult;

  return (
    <MobileFrame>
      <div className="pb-footer-safe flex flex-1 flex-col">
        <PreferenceTopBar title="빵 취향 선택" onCancel={() => navigate({ to: "/home" })} />

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
                className={cn(
                  "flex h-[64px] w-full items-center justify-between rounded-r2 px-x4 transition-colors",
                  hasDepartureResult
                    ? "border border-gray-600 bg-gray-300"
                    : "border border-gray-200 bg-gray-100",
                )}
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
                  className={cn(
                    "flex h-x6 w-x6 items-center justify-center rounded-full text-size-4",
                    hasDepartureResult
                      ? "border border-gray-600 text-gray-900"
                      : "border border-gray-200 text-gray-500",
                  )}
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
                  className={cn(
                    "mx-x3 flex-1 bg-transparent text-left font-sans text-size-5 leading-t6 font-normal tracking-1 outline-none",
                    hasDepartureResult ? "text-gray-900" : "text-gray-500",
                  )}
                />

                <span
                  aria-hidden="true"
                  className={cn(
                    "flex h-x6 w-x6 items-center justify-center text-size-4",
                    hasDepartureResult ? "text-gray-900" : "text-gray-500",
                  )}
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
          <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-x186 -translate-x-1/2 rounded-t-r5 bg-gray-00">
            <div className="flex justify-center py-[14px]">
              <button
                type="button"
                aria-label="출발지 검색 바텀시트 닫기"
                className="h-[4px] w-[36px] rounded-full bg-gray-300"
                onClick={closeDepartureBottomSheet}
              />
            </div>

            <div className="px-x5 pb-x3">
              <div className="flex items-start justify-between">
                <div className="flex flex-1 flex-col gap-x1_5">
                  <h3 className="font-pretendard text-size-7 font-bold leading-t8 text-gray-1000">
                    출발지 검색
                  </h3>
                  <p className="font-pretendard text-size-3 leading-t4 text-gray-700">
                    선택하신 장소 주변으로 코스를 짜드려요.
                  </p>
                </div>
              </div>

              <form
                className="mt-x4 flex h-x14 items-center gap-x2 rounded-r3 border border-gray-300 bg-gray-00 px-x5"
                onSubmit={(event) => {
                  event.preventDefault();
                  handleSearchSubmit();
                }}
              >
                <input
                  autoFocus
                  value={searchKeyword}
                  onChange={(event) => setSearchKeyword(event.target.value)}
                  placeholder="빵집 이름이나 동네를 입력해보세요"
                  className="flex-1 bg-transparent font-pretendard text-size-5 leading-t6 text-gray-1000 outline-none placeholder:text-gray-400"
                />
                <button
                  type="submit"
                  aria-label="출발지 검색"
                  className="flex h-x6 w-x6 items-center justify-center text-size-4 text-gray-700"
                >
                  ⌕
                </button>
              </form>

              <div className="mt-x3">
                <div className="flex items-center justify-between border-b border-gray-200 px-x2_5 pb-x3 pt-x5">
                  <span className="font-pretendard text-[13px] font-bold leading-[18px] text-gray-700">
                    {listTitle}
                  </span>
                  <button
                    type="button"
                    className="font-pretendard text-size-3 leading-t4 text-blue-600"
                  >
                    현재 위치
                  </button>
                </div>

                <div className="flex flex-col">
                  {resultItems.map((item) => (
                    <button
                      key={item}
                      type="button"
                      className="flex h-x14 items-center gap-x1 px-x2_5 text-left"
                      onClick={() => handleResultItemClick(item)}
                    >
                      <span className="text-size-4 text-gray-600">⌕</span>
                      <span className="flex-1 font-pretendard text-size-6 leading-t6 text-gray-1000">
                        {item}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      ) : null}

      <OverlayFooter
        nextDisabled={!canGoNext}
        onLeftClick={() => navigate({ to: "/home" })}
        onRightClick={() => navigate({ to: "/recommendation" })}
      />
    </MobileFrame>
  );
}

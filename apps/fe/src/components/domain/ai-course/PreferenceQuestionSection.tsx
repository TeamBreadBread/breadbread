import PreferenceOptionCard from "./PreferenceOptionCard";
import type { PreferenceQuestion } from "./types";

interface PreferenceQuestionSectionProps {
  question: PreferenceQuestion;
  onToggleOption: (questionId: string, optionId: string) => void;
}

export default function PreferenceQuestionSection({
  question,
  onToggleOption,
}: PreferenceQuestionSectionProps) {
  return (
    <section className="bg-white p-x5">
      <div className="flex flex-col gap-x4">
        <div className="flex items-center justify-between">
          <div className="flex flex-1 items-center gap-x1">
            <div className="flex items-center justify-center p-[3px]">
              <div className="h-[18px] w-[18px] rounded-full bg-[#dcdee3]" />
            </div>

            <h2 className="font-pretendard typo-t6medium text-[#1a1c20]">{question.title}</h2>
          </div>

          {!question.hideSelectionHint && (
            <span className="font-pretendard typo-t4medium whitespace-nowrap text-[#868b94]">
              {question.allowMultiple ? "중복 가능" : "1개 선택"}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-[9px]">
          {question.options.map((option) => (
            <PreferenceOptionCard
              key={option.id}
              label={option.label}
              selected={option.selected}
              onClick={() => onToggleOption(question.id, option.id)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

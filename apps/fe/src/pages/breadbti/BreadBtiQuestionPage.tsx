import { useState, type MouseEvent } from "react";
import { useNavigate } from "@tanstack/react-router";

import BreadBtiMobileFrame from "@/components/domain/breadbti/BreadBtiMobileFrame";
import { breadBtiFlowNavigateOptions } from "@/lib/breadbti/flowNavigation";
import { getMbti, INITIAL_SCORES, MBTI_QUESTIONS, type MbtiTrait } from "@/lib/breadbti/mbti";
import { BREAD_BTI_RESULT_STORAGE_KEY } from "@/lib/breadbti/paths";

export default function BreadBtiQuestionPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scores, setScores] = useState(INITIAL_SCORES);

  const currentQuestion = MBTI_QUESTIONS[currentIndex];
  const progress = Math.round(((currentIndex + 1) / MBTI_QUESTIONS.length) * 100);

  const handleAnswer = (trait: MbtiTrait, event?: MouseEvent<HTMLButtonElement>) => {
    event?.currentTarget.blur();

    const nextScores = {
      ...scores,
      [trait]: scores[trait] + 1,
    };

    const isLastQuestion = currentIndex === MBTI_QUESTIONS.length - 1;

    if (isLastQuestion) {
      const mbti = getMbti(nextScores);
      sessionStorage.setItem(BREAD_BTI_RESULT_STORAGE_KEY, mbti);
      void navigate(breadBtiFlowNavigateOptions("/breadbti/loading"));
      return;
    }

    setScores(nextScores);
    setCurrentIndex((prev) => prev + 1);
  };

  return (
    <BreadBtiMobileFrame>
      <div className="px-5 pt-6">
        <div className="mb-2 text-center text-sm font-semibold text-[#D86A00]">
          {currentIndex + 1} / {MBTI_QUESTIONS.length}
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-white/50">
          <div
            className="h-full rounded-full bg-[#FF8C42] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <main className="flex flex-1 items-center px-5 pb-12 pt-6">
        <div
          key={currentIndex}
          className="w-full rounded-[2rem] bg-white/40 p-6 shadow-lg backdrop-blur-sm"
        >
          <h2 className="mb-8 text-center text-[26px] font-bold leading-relaxed text-[#D86A00]">
            {currentQuestion.question}
          </h2>

          <div className="flex w-full flex-col gap-4">
            <button
              type="button"
              className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-5 text-left font-semibold text-[#D86A00] shadow-lg transition-all hover:border-[#FF8C42] hover:bg-[#FFF4E6] active:scale-98"
              onClick={(event) => handleAnswer(currentQuestion.options[0].trait, event)}
            >
              {currentQuestion.options[0].label}
            </button>
            <button
              type="button"
              className="w-full rounded-2xl border-2 border-transparent bg-white px-6 py-5 text-left font-semibold text-[#D86A00] shadow-lg transition-all hover:border-[#FF8C42] hover:bg-[#FFF4E6] active:scale-98"
              onClick={(event) => handleAnswer(currentQuestion.options[1].trait, event)}
            >
              {currentQuestion.options[1].label}
            </button>
          </div>
        </div>
      </main>
    </BreadBtiMobileFrame>
  );
}

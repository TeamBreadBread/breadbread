import type { CourseSummary } from "./types";

interface ResultSummaryCardProps {
  summary: CourseSummary;
}

export default function ResultSummaryCard({ summary }: ResultSummaryCardProps) {
  return (
    <section className="flex items-center gap-x2_5 bg-white px-x5 pt-x9 pb-x6">
      <div className="flex h-[80px] w-[80px] items-center justify-center p-x2_5">
        <div className="h-[60px] w-[60px] rounded-full bg-[#dcdee3]" />
      </div>

      <div className="flex-1">
        <h2 className="font-pretendard typo-t7bold text-[#1a1c20]">{summary.title}</h2>

        <div className="mt-x2 flex items-center gap-x2">
          <div className="flex items-center gap-x1">
            <span className="font-pretendard typo-t4medium whitespace-nowrap text-[#868b94]">
              소요시간
            </span>
            <span className="font-pretendard typo-t4medium whitespace-nowrap text-[#2a3038]">
              {summary.duration}
            </span>
          </div>

          <span className="font-pretendard typo-t4medium whitespace-nowrap text-[#868b94]">·</span>

          <div className="flex items-center gap-x1">
            <span className="font-pretendard typo-t4medium whitespace-nowrap text-[#868b94]">
              예상비용
            </span>
            <span className="font-pretendard typo-t4medium whitespace-nowrap text-[#2a3038]">
              {summary.price}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

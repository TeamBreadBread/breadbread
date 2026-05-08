import type { CourseSummary } from "./types";

interface ResultSummaryCardProps {
  summary: CourseSummary;
  liked?: boolean;
  likeCount?: number;
  onToggleLike?: () => void;
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      aria-hidden
      className={filled ? "text-red-500" : "text-[#b0b3ba]"}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function ResultSummaryCard({
  summary,
  liked = false,
  likeCount = 0,
  onToggleLike,
}: ResultSummaryCardProps) {
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

      <button
        type="button"
        aria-label={liked ? "코스 좋아요 취소" : "코스 좋아요"}
        aria-pressed={liked}
        className="ml-x2 flex min-w-[52px] shrink-0 flex-col items-center justify-center gap-[2px]"
        onClick={onToggleLike}
      >
        <HeartIcon filled={liked} />
        <span className="font-pretendard text-size-2 text-[#555d6d]">{likeCount}</span>
      </button>
    </section>
  );
}

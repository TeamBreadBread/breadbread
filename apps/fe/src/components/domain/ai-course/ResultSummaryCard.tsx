import { formatCourseEstimatedTime } from "@/utils/formatCourseEstimatedTime";
import AiCourseRecommendReasonPanel from "./AiCourseRecommendReasonPanel";
import CourseBreadThumbnail from "./CourseBreadThumbnail";
import type { CourseSummary } from "./types";

interface ResultSummaryCardProps {
  summary: CourseSummary;
  iconSeed?: string | number;
  recommendReason?: string | null;
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
  iconSeed,
  recommendReason,
  liked = false,
  likeCount = 0,
  onToggleLike,
}: ResultSummaryCardProps) {
  const durationLabel = formatCourseEstimatedTime(summary.duration) || summary.duration;

  return (
    <section className="flex flex-col bg-white px-x5 pt-x9 pb-x6">
      <div className="flex items-center gap-[10px]">
        {iconSeed != null ? (
          <CourseBreadThumbnail seed={iconSeed} size={60} />
        ) : (
          <div className="size-[60px] shrink-0 rounded-full bg-[#dcdee3]" />
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-pretendard typo-t7bold text-[#1a1c20]">{summary.title}</h2>

          <div className="mt-x2 flex flex-wrap items-center gap-x2 gap-y-x1">
            <div className="flex min-w-0 items-center gap-x1">
              <span className="font-pretendard typo-t4medium shrink-0 text-[#868b94]">
                소요시간
              </span>
              <span className="font-pretendard typo-t4medium text-[#2a3038]">{durationLabel}</span>
            </div>

            <span className="font-pretendard typo-t4medium shrink-0 text-[#868b94]">·</span>

            <div className="flex min-w-0 items-center gap-x1">
              <span className="font-pretendard typo-t4medium shrink-0 text-[#868b94]">
                예상비용
              </span>
              <span className="font-pretendard typo-t4medium text-[#2a3038]">{summary.price}</span>
            </div>
          </div>
        </div>

        {onToggleLike ? (
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
        ) : null}
      </div>

      {recommendReason?.trim() ? <AiCourseRecommendReasonPanel reason={recommendReason} /> : null}
    </section>
  );
}

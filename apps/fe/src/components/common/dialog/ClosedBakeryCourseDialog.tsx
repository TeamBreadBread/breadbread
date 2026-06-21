import { cn } from "@/utils/cn";

import type { ClosedCourseBakery } from "@/utils/courseClosedDayValidation";

type ClosedBakeryCourseDialogProps = {
  open: boolean;
  closedBakeries: ClosedCourseBakery[];
  currentIndex: number;
  busy?: boolean;
  onReplace: () => void;
  onExclude: () => void;
};

export default function ClosedBakeryCourseDialog({
  open,
  closedBakeries,
  currentIndex,
  busy = false,
  onReplace,
  onExclude,
}: ClosedBakeryCourseDialogProps) {
  if (!open || closedBakeries.length === 0) return null;

  const current = closedBakeries[currentIndex] ?? closedBakeries[0];
  const remainingCount = closedBakeries.length;
  const progressLabel = remainingCount > 1 ? `${currentIndex + 1}/${remainingCount} · ` : "";

  const bodyLines =
    remainingCount > 1
      ? [
          "아래 휴무 빵집을 확인해 주세요.",
          ...closedBakeries.map((bakery) => `· ${bakery.name}`),
          "",
          `현재 처리: ${current.name}`,
        ]
      : [
          `금일 ${current.name}은 영업 중이 아닙니다.`,
          "다른 빵집으로 변경하거나 코스에서 제외할 수 있습니다.",
        ];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-x5"
      role="presentation"
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="closed-bakery-course-title"
        className={cn(
          "flex w-[320px] flex-col items-start justify-start gap-x6 overflow-hidden rounded-r6 bg-gray-00 p-x6",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col items-center justify-start gap-x2">
          <div
            id="closed-bakery-course-title"
            className="w-full text-center font-pretendard text-size-7 font-bold leading-t7 tracking-0 text-gray-1000"
          >
            오늘은 휴무인 빵집이 있어요 🥲
          </div>
          <div className="w-full whitespace-pre-line text-center font-pretendard text-size-4 leading-t5 tracking-0 text-gray-1000">
            {progressLabel}
            {bodyLines.join("\n")}
          </div>
        </div>

        <div className="flex w-full flex-row items-start justify-center gap-x2-5 overflow-hidden bg-gray-00">
          <button
            type="button"
            disabled={busy}
            onClick={onReplace}
            className="flex flex-1 flex-row items-center justify-center overflow-hidden rounded-r3 bg-gray-200 px-x4 py-x3-5 disabled:opacity-60"
          >
            <span className="whitespace-nowrap text-center font-pretendard text-size-3 font-bold leading-t4 tracking-0 text-gray-1000">
              {busy ? "처리 중..." : "다른 빵집으로 변경"}
            </span>
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onExclude}
            className="flex flex-1 flex-row items-center justify-center overflow-hidden rounded-r3 bg-gray-900 px-x4 py-x3-5 disabled:opacity-60"
          >
            <span className="whitespace-nowrap text-center font-pretendard text-size-3 font-bold leading-t4 tracking-0 text-gray-00">
              {busy ? "처리 중..." : "코스에서 제외"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

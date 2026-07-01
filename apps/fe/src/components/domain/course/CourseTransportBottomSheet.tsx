import { useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/utils/cn";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { COURSE_TRANSPORT_OPTIONS, type CourseTransportMode } from "@/lib/courseTransportMode";

type CourseTransportBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelect: (mode: CourseTransportMode) => void;
};

export default function CourseTransportBottomSheet({
  open,
  onClose,
  onSelect,
}: CourseTransportBottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="닫기"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative w-full rounded-t-[20px] bg-white px-[20px] pb-[max(20px,env(safe-area-inset-bottom))] pt-[12px] shadow-[0_-8px_24px_rgba(26,31,39,0.12)]",
          RESPONSIVE_FRAME_WIDTH,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-transport-sheet-title"
      >
        <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full bg-[#dcdee3]" />

        <h2
          id="course-transport-sheet-title"
          className="font-pretendard text-[18px] font-bold leading-[24px] text-[#1a1c20]"
        >
          이동 수단을 선택해 주세요
        </h2>
        <p className="mt-[6px] font-pretendard text-[14px] leading-[20px] text-[#868b94]">
          선택한 수단에 맞춰 코스 경로를 안내해 드릴게요.
        </p>

        <div className="mt-[16px] flex flex-col gap-[10px]">
          {COURSE_TRANSPORT_OPTIONS.map((option) => (
            <button
              key={option.mode}
              type="button"
              onClick={() => onSelect(option.mode)}
              className="flex w-full flex-col items-start rounded-[12px] border border-[#eaebec] bg-white px-[16px] py-[14px] text-left transition-colors hover:border-orange-300 hover:bg-orange-50"
            >
              <span className="font-pretendard text-[16px] font-bold leading-[22px] text-[#1a1c20]">
                {option.label}
              </span>
              <span className="mt-[2px] font-pretendard text-[13px] leading-[18px] text-[#868b94]">
                {option.description}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-[12px] flex h-[48px] w-full items-center justify-center rounded-[12px] bg-[#f3f4f5] font-pretendard text-[15px] font-medium text-[#555d6d]"
        >
          취소
        </button>
      </div>
    </div>,
    document.body,
  );
}

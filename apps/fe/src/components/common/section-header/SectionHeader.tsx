import type { ReactNode } from "react";
import { cn } from "@/utils/cn";

interface SectionHeaderProps {
  title: string;
  titleClassName?: string;
  rightText?: string;
  leftIcon?: ReactNode;
  /** `leftIcon`과 동일 용도 (홈 등에서 사용) */
  icon?: ReactNode;
  /** 아이콘 미지정 시 기본 원형 아이콘 노출 여부 */
  showDefaultIcon?: boolean;
  actionLabel?: string;
  onActionClick?: () => void;
  /** 제목 영역(아이콘+타이틀)만 탭했을 때 (더보기 버튼 제외) */
  onTitleAreaClick?: () => void;
}

export default function SectionHeader({
  title,
  titleClassName,
  rightText,
  leftIcon,
  icon,
  showDefaultIcon = true,
  actionLabel,
  onActionClick,
  onTitleAreaClick,
}: SectionHeaderProps) {
  const leading = leftIcon ?? icon;

  const titleArea = (
    <>
      {leading || showDefaultIcon ? (
        <div className="flex items-center justify-start p-x0-5">
          {leading ?? <div className="h-x4-5 w-x4-5 rounded-full bg-gray-400" />}
        </div>
      ) : null}

      <h3
        className={cn(
          "flex-1 text-left font-sans text-gray-1000",
          titleClassName ?? "text-size-6 leading-t6 font-medium tracking-2",
          titleClassName,
        )}
      >
        {title}
      </h3>
    </>
  );

  return (
    <div className="flex w-full items-start justify-between">
      {onTitleAreaClick ? (
        <button
          type="button"
          className="flex flex-1 items-start gap-x1 rounded-[8px] text-left outline-none focus-visible:ring-2 focus-visible:ring-[#868b94]/30"
          onClick={onTitleAreaClick}
        >
          {titleArea}
        </button>
      ) : (
        <div className="flex flex-1 items-start gap-x1">{titleArea}</div>
      )}

      {actionLabel && onActionClick ? (
        <button
          type="button"
          onClick={onActionClick}
          className="font-sans text-size-3 leading-t4 font-normal tracking-1 shrink-0 whitespace-nowrap text-gray-700"
        >
          {actionLabel}
        </button>
      ) : rightText ? (
        <span className="font-sans text-size-3 leading-t4 font-medium tracking-1 cursor-default select-none whitespace-nowrap text-right text-gray-700">
          {rightText}
        </span>
      ) : null}
    </div>
  );
}

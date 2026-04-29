import { useState } from "react";
import { cn } from "@/utils/cn";
import type { RouteCourse } from "./types";

interface RouteListItemProps {
  course: RouteCourse;
  onClick?: () => void;
}

export default function RouteListItem({ course, onClick }: RouteListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const handleItemClick = () => {
    setIsExpanded((prev) => !prev);
    onClick?.();
  };

  const handleItemKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleItemClick();
    }
  };

  const handleKebabClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setIsBottomSheetOpen(true);
  };

  return (
    <div className="w-full border-b border-gray-100 bg-gray-00">
      <div
        role="button"
        tabIndex={0}
        onClick={handleItemClick}
        onKeyDown={handleItemKeyDown}
        className="flex w-full cursor-pointer items-start gap-[10px] py-x6 text-left"
      >
        <div className="flex h-[46px] w-[46px] items-center justify-center p-[6px]">
          <div className="h-[35px] w-[35px] rounded-full bg-gray-400" />
        </div>

        <div className="flex-1">
          <div className="font-pretendard text-size-5 font-bold leading-t6 tracking-[-0.1px] text-gray-1000">
            {course.title}
          </div>

          <div className="mt-x1 flex items-center gap-x2">
            <div className="flex items-center gap-x1">
              <span className="font-pretendard typo-t3regular whitespace-nowrap text-gray-700">
                소요시간
              </span>
              <span className="font-pretendard typo-t3regular whitespace-nowrap text-gray-900">
                {course.duration}
              </span>
            </div>

            <span className="font-pretendard typo-t3regular whitespace-nowrap text-gray-700">
              ·
            </span>

            <div className="flex items-center gap-x1">
              <span className="font-pretendard typo-t3regular whitespace-nowrap text-gray-700">
                방문 매장 수
              </span>
              <div className="flex items-center gap-[2px]">
                <span className="font-pretendard typo-t3regular whitespace-nowrap text-gray-900">
                  {course.storeCount}곳
                </span>
                <div className="h-[18px] w-[18px] rounded-full bg-gray-500" />
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleKebabClick}
          aria-label="바텀시트 열기"
          className="flex h-x6 w-x6 cursor-pointer flex-col items-center justify-center gap-[2px]"
        >
          <span className="h-[3px] w-[3px] rounded-full bg-gray-700" />
          <span className="h-[3px] w-[3px] rounded-full bg-gray-700" />
          <span className="h-[3px] w-[3px] rounded-full bg-gray-700" />
        </button>
      </div>

      {isExpanded ? (
        <div className="mx-auto mb-x6 flex h-[130px] w-[362px] flex-col items-start justify-start overflow-hidden rounded-r2 border border-gray-200 bg-gray-100 p-[14px]">
          <div className="relative flex w-full flex-col items-start justify-start gap-[6px] px-0 py-[4px]">
            <div className="absolute bottom-0 left-[2px] top-0 w-[2px] bg-gray-300" />

            {["성심당 본점", "몽심 대흥점", "땡큐베리머치", "뮤제 베이커리"].map((store) => (
              <div key={store} className="flex w-full items-center justify-start gap-[6.5px]">
                <div className="z-10 h-[6px] w-[6px] rounded-full bg-gray-500" />
                <div className="flex-1 font-pretendard text-size-3 font-normal leading-t4 text-gray-800">
                  {store}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {isBottomSheetOpen ? (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="코스 옵션">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="바텀시트 닫기"
            onClick={() => setIsBottomSheetOpen(false)}
          />

          <div className="absolute bottom-0 left-1/2 flex max-h-[500px] w-full max-w-[402px] -translate-x-1/2 flex-col items-start justify-start gap-[12px] overflow-hidden rounded-tl-[24px] rounded-tr-[24px] bg-white">
            <div className="relative h-[24px] w-full shrink-0 overflow-hidden bg-white">
              <button
                type="button"
                onClick={() => setIsBottomSheetOpen(false)}
                aria-label="바텀시트 닫기 핸들"
                className="absolute left-1/2 top-1/2 h-[20px] w-[72px] -translate-x-1/2 -translate-y-1/2"
              >
                <span className="absolute left-1/2 top-1/2 h-[4px] w-[36px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400" />
              </button>
            </div>

            <div className="flex w-full flex-row items-start justify-start px-[20px] py-0">
              <div className="flex w-full flex-col items-start justify-start">
                <div className="flex w-full flex-col items-start justify-start">
                  <button
                    type="button"
                    className="flex w-full flex-row items-center justify-start gap-x1 overflow-hidden bg-white px-0 py-[16px] text-left"
                  >
                    <div className="h-6 w-6 rounded-full bg-gray-500" />
                    <div className="flex-1 font-pretendard text-size-5 font-normal leading-t6 text-gray-1000">
                      코스 저장
                    </div>
                  </button>

                  <button
                    type="button"
                    className="flex w-full flex-row items-center justify-start gap-x1 overflow-hidden bg-white px-0 py-[16px] text-left"
                  >
                    <div className="h-6 w-6 rounded-full bg-gray-500" />
                    <div
                      className={cn(
                        "flex-1 font-pretendard text-size-5 font-normal leading-t6",
                        "text-[#fa342c]",
                      )}
                    >
                      코스 삭제
                    </div>
                  </button>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="h-[33px] w-full shrink-0" />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

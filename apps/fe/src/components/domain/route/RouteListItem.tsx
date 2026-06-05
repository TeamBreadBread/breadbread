import { useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import { pickCourseBreadIcon } from "@/lib/courseBreadIcons";
import { RESPONSIVE_FRAME_WIDTH } from "@/components/layout/layout.constants";
import { cn } from "@/utils/cn";
import type { RouteCourse } from "./types";

interface RouteListItemProps {
  course: RouteCourse;
  onClick?: () => void;
  onOpenCourse?: (courseId: string) => void;
  onDeleteCourse?: (courseId: string) => void;
  onToggleCourseLike?: (courseId: string) => void;
}

function buildCourseShareLink(courseId: string): string {
  const { origin, pathname } = window.location;
  const url = new URL(origin + pathname);
  url.searchParams.set("course", courseId);
  return url.toString();
}

export default function RouteListItem({
  course,
  onClick,
  onOpenCourse,
  onDeleteCourse,
  onToggleCourseLike,
}: RouteListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const courseIconSrc = pickCourseBreadIcon(course.id);

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

  const closeSheet = () => setIsBottomSheetOpen(false);

  const handleCopyLink = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const link = buildCourseShareLink(course.id);
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      window.prompt("링크를 복사하세요", link);
    }
    closeSheet();
  };

  const handleKakaoShare = async (event: React.MouseEvent) => {
    event.stopPropagation();
    const link = buildCourseShareLink(course.id);
    const text = `${course.title}\n${link}`;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: course.title, text, url: link });
      } catch {
        /* 사용자 취소 등 */
      }
      closeSheet();
      return;
    }
    window.location.href = `kakaotalk://send?text=${encodeURIComponent(text)}`;
    closeSheet();
  };

  const handleDeleteCourse = (event: React.MouseEvent) => {
    event.stopPropagation();
    onDeleteCourse?.(course.id);
    closeSheet();
  };

  const handleToggleLike = (event: React.MouseEvent) => {
    event.stopPropagation();
    onToggleCourseLike?.(course.id);
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
          <img
            src={courseIconSrc}
            alt=""
            aria-hidden
            className="h-[35px] w-[35px] object-contain"
          />
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
                <AppIcon
                  src={IconAssets.IcChevronDown}
                  size={18}
                  className={cn("transition-transform", isExpanded && "rotate-180")}
                  alt=""
                />
              </div>
            </div>

            <span className="font-pretendard typo-t3regular whitespace-nowrap text-gray-700">
              ·
            </span>
            <button
              type="button"
              aria-label={course.liked ? "코스 좋아요 취소" : "코스 좋아요"}
              aria-pressed={course.liked}
              onClick={handleToggleLike}
              className="flex items-center gap-x1"
            >
              <AppIcon
                src={IconAssets.IcHeart}
                size={18}
                className={course.liked ? "red_700" : "opacity-45"}
                alt=""
              />
              <span className="font-pretendard typo-t3regular whitespace-nowrap text-gray-900">
                {course.likeCount}
              </span>
            </button>
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
        <div
          role="button"
          tabIndex={0}
          onClick={() => onOpenCourse?.(course.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onOpenCourse?.(course.id);
            }
          }}
          className="mx-auto mb-x6 flex h-[130px] w-full max-w-[362px] cursor-pointer flex-col items-start justify-start overflow-hidden rounded-r2 border border-gray-200 bg-gray-100 p-[14px] md:max-w-full"
        >
          <div className="relative flex w-full flex-col items-start justify-start gap-[6px] px-0 py-[4px]">
            <div className="absolute bottom-0 left-[2px] top-0 w-[2px] bg-gray-300" />

            {course.bakeryNames.map((store) => (
              <div key={store} className="flex w-full items-center justify-start gap-[6.5px]">
                <AppIcon src={IconAssets.IcPin} size={6} className="z-10" alt="" />
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
            onClick={closeSheet}
          />

          <div
            className={cn(
              "absolute bottom-0 left-1/2 flex max-h-[500px] w-full -translate-x-1/2 flex-col items-start justify-start overflow-hidden rounded-tl-[24px] rounded-tr-[24px] bg-white",
              RESPONSIVE_FRAME_WIDTH,
            )}
          >
            <div className="relative h-[24px] w-full shrink-0 overflow-hidden bg-white">
              <button
                type="button"
                onClick={closeSheet}
                aria-label="바텀시트 닫기 핸들"
                className="absolute left-1/2 top-1/2 h-[20px] w-[72px] -translate-x-1/2 -translate-y-1/2"
              >
                <span className="absolute left-1/2 top-1/2 h-[4px] w-[36px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400" />
              </button>
            </div>

            <div className="flex w-full flex-row items-start justify-start px-[20px] pb-[calc(49px+env(safe-area-inset-bottom,0px))]">
              <div className="flex w-full flex-col items-start justify-start">
                <div className="flex w-full flex-col items-start justify-start gap-x2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex w-full flex-row items-center justify-start gap-x2 overflow-hidden bg-white px-0 py-[16px] text-left"
                  >
                    <AppIcon src={IconAssets.IcLink} size={24} alt="" />
                    <div className="flex-1 font-pretendard text-size-5 font-normal leading-t6 text-gray-1000">
                      링크 복사하기
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleKakaoShare}
                    className="flex w-full flex-row items-center justify-start gap-x2 overflow-hidden bg-white px-0 py-[16px] text-left"
                  >
                    <AppIcon src={IconAssets.IcLogoKakao} size={24} alt="" />
                    <div className="flex-1 font-pretendard text-size-5 font-normal leading-t6 text-gray-1000">
                      카카오톡으로 공유하기
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteCourse}
                    className="flex w-full flex-row items-center justify-start gap-x2 overflow-hidden bg-white px-0 py-[16px] text-left"
                  >
                    <AppIcon src={IconAssets.IcTrash} size={24} alt="" />
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
          </div>
        </div>
      ) : null}
    </div>
  );
}

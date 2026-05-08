import Skeleton from "@/components/common/skeleton/Skeleton";
import { cn } from "@/utils/cn";
import {
  FIXED_TOP_BAR_FRAME_CLASS,
  FIXED_TOP_BAR_SPACER_CLASS,
  RESPONSIVE_FRAME_WIDTH,
} from "@/components/layout/layout.constants";

// 지금은 회색 박스 하나만 있지만, 나중에 로고나 프로필로 바뀔 가능성이 높아 보여서 따로 뺌
const TopHeader = () => {
  return (
    <>
      <header className={cn(FIXED_TOP_BAR_FRAME_CLASS, RESPONSIVE_FRAME_WIDTH, "bg-white")}>
        <div className="flex h-[56px] items-center justify-between px-5">
          <div className="flex w-[63px] items-center justify-start rounded-[var(--radius-r2)] p-1">
            <Skeleton className="h-[29px] w-full" />
          </div>

          {/* 필요하면 알림/프로필/로고 넣기 */}
          <div />
        </div>
      </header>
      <div className={FIXED_TOP_BAR_SPACER_CLASS} aria-hidden />
    </>
  );
};

export default TopHeader;

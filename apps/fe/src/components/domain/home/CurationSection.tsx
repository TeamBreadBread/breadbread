// 큐레이션 문구 + 더보기 + 큰 하단 콘텐츠 영역
// SectionHeader(제목+더보기) + CurationFooter
import SectionHeader from "@/components/common/section-header/SectionHeader";
import Skeleton from "@/components/common/skeleton/Skeleton";
import { cn } from "@/utils/cn";
import { APP_SHELL_MAX_WIDTH } from "@/components/layout/layout.constants";
import CurationFooter from "./CurationFooter";

const CurationSection = () => {
  const handleMoreClick = () => {
    // TODO: 큐레이션 전체보기 라우트 연결
  };

  return (
    <section
      // 아직 데스크탑 기준 디자인이 확정되지 않아서 일단 최대 너비만 맞춰놓고, 스크롤 바 없애려고 임의의 height 설정
      className={cn(
        "w-full h-[364px] md:h-[400px] bg-white",
        "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
        APP_SHELL_MAX_WIDTH,
      )}
    >
      <div className="flex h-full flex-col gap-[var(--spacing-x3)]">
        <SectionHeader
          title="큐레이션 문구"
          actionLabel="더보기"
          onActionClick={handleMoreClick}
          icon={
            <Skeleton shape="circle" className="h-[var(--spacing-x4-5)] w-[var(--spacing-x4-5)]" />
          }
        />

        <div className="w-full min-h-0 flex-1">
          <CurationFooter />
        </div>
      </div>
    </section>
  );
};

export default CurationSection;

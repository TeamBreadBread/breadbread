import HorizontalScrollArea from "@/components/common/HorizontalScrollArea";
import SectionHeader from "@/components/common/section-header/SectionHeader";
import Skeleton from "@/components/common/skeleton/Skeleton";
import TrendHotBreadCard from "@/components/domain/trend/TrendHotBreadCard";
import { useTrendingBreads } from "@/hooks/trend/useTrendingBreads";
import { cn } from "@/utils/cn";
import { APP_SHELL_MAX_WIDTH } from "@/components/layout/layout.constants";

const SKELETON_COUNT = 4;

type TrendHotBreadsSectionProps = {
  title?: string;
  compact?: boolean;
  className?: string;
};

export default function TrendHotBreadsSection({
  title = "SNS에서 핫한 빵",
  compact = false,
  className,
}: TrendHotBreadsSectionProps) {
  const { data, isLoading, isError } = useTrendingBreads();

  if (isError) {
    return null;
  }

  const breads = data?.breads ?? [];
  const cardSkeletonClass = compact
    ? "h-[88px] w-[132px] flex-shrink-0 rounded-[var(--radius-r3)]"
    : "h-[96px] w-[156px] flex-shrink-0 rounded-[var(--radius-r3)]";

  return (
    <section
      className={cn(
        "w-full bg-white",
        compact ? "px-[20px] py-[18px]" : "px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6",
        !compact && APP_SHELL_MAX_WIDTH,
        className,
      )}
    >
      <div className="flex flex-col gap-[12px]">
        <SectionHeader
          title={title}
          titleClassName={compact ? "typo-t6bold text-gray-1000" : "font-sans typo-t6bold"}
          showDefaultIcon={false}
        />

        {isLoading ? (
          <HorizontalScrollArea aria-label="SNS 트렌드 빵 로딩">
            <div className="flex w-max gap-[var(--spacing-x4)]">
              {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <Skeleton key={index} className={cardSkeletonClass} />
              ))}
            </div>
          </HorizontalScrollArea>
        ) : breads.length === 0 ? (
          <div className="flex min-h-[72px] w-full items-center justify-center rounded-[var(--radius-r3)] bg-[var(--color-gray-200)] px-4 text-center text-[length:var(--font-size-3)] text-[var(--color-gray-600)]">
            아직 수집된 트렌드 빵이 없어요.
          </div>
        ) : (
          <HorizontalScrollArea aria-label="SNS 트렌드 빵 목록">
            <div className="flex w-max gap-[var(--spacing-x3)]">
              {breads.map((bread) => (
                <TrendHotBreadCard key={bread.keyword} bread={bread} compact={compact} />
              ))}
            </div>
          </HorizontalScrollArea>
        )}
      </div>
    </section>
  );
}

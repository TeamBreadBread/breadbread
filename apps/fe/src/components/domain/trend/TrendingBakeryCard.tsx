import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { cn } from "@/utils/cn";
import type { TrendBakery } from "@/types/trend";
import TrendStatusBadge from "@/components/domain/trend/TrendStatusBadge";
import { formatGrowthRate, formatTrendScore } from "@/utils/trendCuration";
import { getSafeImageUrl } from "@/utils/safeImageUrl";

type TrendingBakeryCardProps = {
  bakery: TrendBakery;
  imageUrl?: string | null;
  compact?: boolean;
  className?: string;
  onClick?: () => void;
};

export default function TrendingBakeryCard({
  bakery,
  imageUrl,
  compact = false,
  className,
  onClick,
}: TrendingBakeryCardProps) {
  const title = bakery.bakeryName?.trim() || "빵집";
  const matchedMenus = bakery.matchedMenus?.filter(Boolean) ?? [];
  const menuPreview = matchedMenus.length > 0 ? matchedMenus.slice(0, 2).join(", ") : null;
  const scoreLabel = formatTrendScore(bakery.trendScore);
  const growthLabel = formatGrowthRate(bakery.growthRate);
  const photo = getSafeImageUrl(imageUrl ?? undefined);

  const content = (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-[var(--radius-r3)] bg-[var(--color-gray-200)]",
          compact ? "h-[152px] w-[160px]" : "h-[200px] w-[220px]",
        )}
      >
        {photo ? (
          <img src={photo} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <img
              src={currationBreadImg}
              alt=""
              aria-hidden
              className={cn("object-contain", compact ? "h-[40px] w-[40px]" : "h-[56px] w-[58px]")}
              loading="lazy"
            />
          </div>
        )}
        <div className="absolute left-[8px] top-[8px] flex flex-wrap gap-[4px]">
          <TrendStatusBadge status={bakery.trendStatus} />
        </div>
      </div>

      <div className={cn("flex min-w-0 flex-col gap-[4px]", compact ? "w-[160px]" : "w-[220px]")}>
        <p className="truncate text-[14px] font-bold leading-[19px] text-[var(--color-gray-1000)]">
          {title}
        </p>
        {menuPreview ? (
          <p className="line-clamp-2 text-[12px] leading-[16px] text-[var(--color-gray-700)]">
            {menuPreview}
          </p>
        ) : null}
        {(scoreLabel || growthLabel) && (
          <div className="flex flex-wrap items-center gap-[6px] text-[11px] leading-[16px] text-[var(--color-gray-500)]">
            {scoreLabel ? <span>트렌드 {scoreLabel}</span> : null}
            {growthLabel ? <span>{growthLabel}</span> : null}
          </div>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("flex shrink-0 flex-col gap-[8px] text-left", className)}
      >
        {content}
      </button>
    );
  }

  return <div className={cn("flex shrink-0 flex-col gap-[8px]", className)}>{content}</div>;
}

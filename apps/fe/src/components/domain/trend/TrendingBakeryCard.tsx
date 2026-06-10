import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { cn } from "@/utils/cn";
import type { TrendBakery } from "@/types/trend";
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

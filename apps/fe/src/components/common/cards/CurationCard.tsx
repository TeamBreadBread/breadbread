import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

type CurationCardProps = {
  title?: string;
  address?: string;
  rate?: number;
  /** 빵집 썸네일 URL (없으면 기본 빵 일러스트) */
  imageUrl?: string | null;
  className?: string;
  imageClassName?: string;
  breadIconClassName?: string;
};

const CurationCard = ({
  title = "빵집 이름",
  address = "소제동",
  rate = 4.5,
  imageUrl,
  className,
  imageClassName,
  breadIconClassName,
}: CurationCardProps) => {
  const hasPhoto = Boolean(imageUrl?.trim());

  return (
    <div className={cn("w-full flex flex-col gap-[var(--spacing-x2)]", className)}>
      {/* 카드 이미지 영역 */}
      <div
        className={cn(
          "relative w-[254px] h-[240px] gap-[var(--spacing-x2)]",
          "rounded-[var(--radius-r3)] overflow-hidden bg-[var(--color-gray-200)]",
          "flex items-center justify-center",
          imageClassName,
        )}
      >
        {hasPhoto ? (
          <img src={imageUrl!} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <img
            src={currationBreadImg}
            alt=""
            aria-hidden
            className={cn("h-[61px] w-[63px] object-contain", breadIconClassName)}
            loading="lazy"
          />
        )}
      </div>

      {/* 카드 정보 영역 */}
      <div className="flex flex-col gap-[var(--spacing-x1)]">
        <p
          className={cn(
            "text-[length:var(--font-size-4)] leading-[var(--leading-t5)]",
            "font-bold tracking-[var(--tracking-2)] text-[var(--color-gray-1000)]",
          )}
        >
          {title}
        </p>
        <div
          className={cn(
            "flex w-full min-w-0 items-center gap-[var(--spacing-x0-5)]",
            "text-[length:var(--font-size-1)] leading-[var(--leading-t2)] font-medium",
            "text-[var(--color-gray-700)]",
          )}
        >
          <AppIcon src={IconAssets.IcPin} size="x3" className="icon-gray-600 shrink-0" />
          <span className="min-w-0 flex-1 truncate">{address}</span>
          <span className="shrink-0">·</span>
          <AppIcon src={IconAssets.IcStar} size="x3" className="icon-orange-600 shrink-0" />
          <span className="shrink-0">{rate}</span>
        </div>
      </div>
    </div>
  );
};

export default CurationCard;

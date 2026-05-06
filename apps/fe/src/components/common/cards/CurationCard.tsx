import mapIcon from "@/assets/icons/mapIcon.svg";
import starIcon from "@/assets/icons/Star.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { cn } from "@/utils/cn";

type CurationCardProps = {
  title?: string;
  address?: string;
  rate?: number;
  className?: string;
  imageClassName?: string;
  breadIconClassName?: string;
};

const CurationCard = ({
  title = "빵집 이름",
  address = "소제동",
  rate = 4.5,
  className,
  imageClassName,
  breadIconClassName,
}: CurationCardProps) => {
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
        <img
          src={currationBreadImg}
          alt="빵"
          className={cn("h-[61px] w-[63px] object-contain", breadIconClassName)}
          loading="lazy"
        />
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
          <img
            src={mapIcon}
            alt="위치"
            className="h-[var(--spacing-x3)] w-[var(--spacing-x3)] shrink-0"
          />
          <span className="min-w-0 flex-1 truncate">{address}</span>
          <span className="shrink-0">·</span>
          <img
            src={starIcon}
            alt="별점"
            className="h-[var(--spacing-x3)] w-[var(--spacing-x3)] shrink-0"
          />
          <span className="shrink-0">{rate}</span>
        </div>
      </div>
    </div>
  );
};

export default CurationCard;

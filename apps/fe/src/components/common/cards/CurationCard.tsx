import mapIcon from "@/assets/icons/mapIcon.svg";
import starIcon from "@/assets/icons/Star.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";
import { cn } from "@/utils/cn";

type CurationCardProps = {
  title?: string;
  address?: string;
  rate?: number;
  className?: string;
};

const CurationCard = ({
  title = "빵집 이름",
  address = "소제동",
  rate = 4.5,
  className,
}: CurationCardProps) => {
  return (
    <div className={cn("w-full flex flex-col gap-[var(--spacing-x2)]", className)}>
      {/* 카드 이미지 영역 */}
      <div
        className={cn(
          "relative w-[254px] h-[240px] gap-[var(--spacing-x2)]",
          "rounded-[var(--radius-r3)] overflow-hidden bg-[var(--color-gray-200)]",
          "flex items-center justify-center",
        )}
      >
        <img
          src={currationBreadImg}
          alt="빵"
          className="h-[61px] w-[63px] object-contain"
          loading="lazy"
        />
      </div>

      {/* 카드 정보 영역 */}
      <div className="flex flex-col gap-[var(--spacing-x1)]">
        <p
          className={cn(
            "text-[var(--font-size-4)] leading-[var(--leading-t5)]",
            "font-bold tracking-[var(--tracking-2)] text-[var(--color-gray-1000)]",
          )}
        >
          {title}
        </p>
        <div
          className={cn(
            "flex items-center gap-[var(--spacing-x0-5)]",
            "text-[var(--font-size-1)] leading-[var(--leading-t2)] font-medium",
            "text-[var(--color-gray-700)]",
          )}
        >
          <img src={mapIcon} alt="위치" className="h-[var(--spacing-x3)] w-[var(--spacing-x3)]" />
          <span>{address}</span>
          <span>·</span>
          <img src={starIcon} alt="별점" className="h-[var(--spacing-x3)] w-[var(--spacing-x3)]" />
          <span>{rate}</span>
        </div>
      </div>
    </div>
  );
};

export default CurationCard;

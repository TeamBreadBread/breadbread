import mapIcon from "@/assets/icons/mapIcon.svg";
import starIcon from "@/assets/icons/Star.svg";
import currationBreadImg from "@/assets/images/Curration_CardBread.png";

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
    <div className={`w-full flex flex-col gap-3 ${className ?? ""}`}>
      {/* 카드 이미지 영역 */}
      <div className="relative w-[254px] h-[240px] gap-2 rounded-[var(--radius-r3)] overflow-hidden bg-gray-200 flex items-center justify-center">
        <img
          src={currationBreadImg}
          alt="빵"
          className="h-[80px] w-[80px] object-contain"
          loading="lazy"
        />
      </div>

      {/* 카드 정보 영역 */}
      <div className="flex flex-col gap-2">
        <p className="text-[16px] leading-[22px] font-bold tracking-[-0.02em] text-gray-1000">
          {title}
        </p>
        <div className="flex items-center gap-1 text-[12px] leading-[16px] font-medium text-gray-700">
          <img src={mapIcon} alt="위치" className="h-[12px] w-[12px]" />
          <span>{address}</span>
          <span>·</span>
          <img src={starIcon} alt="별점" className="h-[12px] w-[12px]" />
          <span>{rate}</span>
        </div>
      </div>
    </div>
  );
};

export default CurationCard;

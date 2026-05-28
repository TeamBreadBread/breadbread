import icChevronRight from "@/assets/icons/Ic_ChevronRight.svg";
import imgAiRecommand from "@/assets/icons/Img_AIRecommand.svg";

// 왼쪽 큰 빵집 추천 카드
type RecommendationHeroCardProps = {
  onClick?: () => void;
};

const RecommendationHeroCard = ({ onClick }: RecommendationHeroCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[188px] w-[177px] flex-1 flex-col overflow-hidden rounded-[var(--radius-r2)] bg-gray-100 text-left"
    >
      <div className="flex flex-col gap-1 px-[14px] pt-4">
        <p className="typo-t3regular text-gray-700">내 취향 빵집 찾아보기</p>
        <div className="flex items-center gap-1">
          <span className="typo-t5bold text-gray-1000">AI 빵집 추천</span>
          <img src={icChevronRight} alt="" aria-hidden className="h-6 w-6 shrink-0" />
        </div>
      </div>

      <div className="mt-auto h-[110px] w-full shrink-0">
        <img
          src={imgAiRecommand}
          alt=""
          aria-hidden
          className="h-full w-full object-contain object-right-bottom"
        />
      </div>
    </button>
  );
};

export default RecommendationHeroCard;

import Skeleton from "@/components/common/skeleton/Skeleton";
import aiStarIcon from "@/assets/icons/ai_Star.svg";

// 왼쪽 큰 빵집 추천 카드
const RecommendationHeroCard = () => {
  return (
    <div className="flex w-[177px] h-[187px] flex-1 flex-col justify-between overflow-hidden rounded-[var(--radius-r2)] bg-gray-800 px-[14px] py-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <span className="text-[16px] leading-[22px] font-bold tracking-[-0.02em] text-white">
            빵집 추천
          </span>

          <img src={aiStarIcon} alt="추천 아이콘" className="h-[16px] w-[16px]" />
        </div>

        <p className="text-[12px] leading-[16px] text-gray-600">설명 문구</p>
      </div>

      <div className="flex justify-end">
        <div className="flex items-center justify-center p-1">
          {/* 나중에 빵 이미지 삽입 */}
          <Skeleton shape="circle" className="h-[56px] w-[56px]" />
        </div>
      </div>
    </div>
  );
};

export default RecommendationHeroCard;

import imgAiRecommand from "@/assets/icons/Img_AIRecommand.svg";

function ChevronRight14() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className="shrink-0 text-gray-800"
    >
      <path
        d="M10.7588 4.34919C10.3993 3.92986 9.76891 3.88137 9.34959 4.24079C8.93026 4.60021 8.88177 5.23064 9.24119 5.64997L14.6845 11.9996L9.24119 18.3492C8.88177 18.7685 8.93026 19.3989 9.34959 19.7584C9.76891 20.1178 10.3993 20.0693 10.7588 19.65L16.7588 12.65C17.0798 12.2755 17.0798 11.7237 16.7588 11.3492L10.7588 4.34919Z"
        fill="currentColor"
      />
    </svg>
  );
}

// 왼쪽 큰 빵집 추천 카드
type RecommendationHeroCardProps = {
  onClick?: () => void;
  disabled?: boolean;
};

const RecommendationHeroCard = ({ onClick, disabled }: RecommendationHeroCardProps) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-[188px] w-[177px] flex-1 flex-col overflow-hidden rounded-[var(--radius-r2)] bg-gray-100 font-sans text-left disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="flex flex-col gap-1 px-[14px] pt-4">
        <p className="font-sans typo-t3regular text-gray-700">내 취향 빵집 찾아보기</p>
        <p className="flex items-center gap-1 font-sans typo-t5bold tracking-[-0.1px] text-gray-1000">
          AI 빵집 추천
          <ChevronRight14 />
        </p>
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

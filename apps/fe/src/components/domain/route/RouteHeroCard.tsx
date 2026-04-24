interface RouteHeroCardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

export default function RouteHeroCard({ title, description, onClick }: RouteHeroCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-x2_5 overflow-hidden rounded-r2 bg-[#eff6ff] px-x4 py-[18px] text-left"
    >
      <div className="flex h-x14 w-x14 items-center justify-center p-[7px]">
        <div className="h-[42px] w-[42px] rounded-full bg-gray-400" />
      </div>

      <div className="flex-1">
        <div className="font-pretendard text-size-5 font-bold leading-t6 tracking-[-0.1px] text-gray-1000">
          {title}
        </div>
        <div className="font-pretendard typo-t3regular text-gray-700">{description}</div>
      </div>

      <div className="h-x6 w-x6 rounded-full bg-gray-500" />
    </button>
  );
}

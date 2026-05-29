import { AppIcon, IconAssets } from "@/components/icons";

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
        <AppIcon src={IconAssets.IcAi} size={42} alt="" />
      </div>

      <div className="flex-1">
        <div className="font-pretendard text-size-5 font-bold leading-t6 tracking-[-0.1px] text-gray-1000">
          {title}
        </div>
        <div className="font-pretendard typo-t3regular text-gray-700">{description}</div>
      </div>

      <AppIcon src={IconAssets.IcChevronRight} size="x6" alt="" />
    </button>
  );
}

import { AppIcon, IconAssets } from "@/components/icons";

interface RouteHeroCardProps {
  title: string;
  description: string;
  onClick?: () => void;
}

function ChevronRight24() {
  return (
    <svg
      width="24"
      height="24"
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

export default function RouteHeroCard({ title, description, onClick }: RouteHeroCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-x2_5 overflow-hidden rounded-r2 bg-gray-100 px-x4 py-[18px] text-left"
    >
      <div className="flex h-x14 w-x14 shrink-0 items-center justify-center">
        <AppIcon src={IconAssets.ImgAi} size={56} alt="" />
      </div>

      <div className="flex-1">
        <div className="font-pretendard text-size-5 font-bold leading-t6 tracking-[-0.1px] text-gray-1000">
          {title}
        </div>
        <div className="font-pretendard typo-t3regular text-gray-700">{description}</div>
      </div>

      <ChevronRight24 />
    </button>
  );
}

import { AppIcon, IconAssets } from "@/components/icons";

interface MyMenuItemProps {
  label: string;
  iconSrc?: string;
  onClick?: () => void;
}

export default function MyMenuItem({ label, iconSrc, onClick }: MyMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between bg-white px-x5 py-x6 text-left"
    >
      <div className="flex min-w-0 items-center gap-x1-5">
        {iconSrc ? (
          <AppIcon src={iconSrc} size="x6" color="gray-500" className="shrink-0" alt="" />
        ) : null}
        <span className="font-pretendard typo-t5medium text-[#1a1c20]">{label}</span>
      </div>

      <AppIcon src={IconAssets.IcChevronRight} size="x6" color="gray-500" className="shrink-0" />
    </button>
  );
}

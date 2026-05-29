import { AppIcon, IconAssets } from "@/components/icons";

interface MyMenuItemProps {
  label: string;
  onClick?: () => void;
}

export default function MyMenuItem({ label, onClick }: MyMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between bg-white px-x5 py-x6 text-left"
    >
      <div className="flex items-center gap-x1-5">
        <AppIcon src={IconAssets.IcPerson} size="x6" className="opacity-60" />
        <span className="font-pretendard typo-t5medium text-[#1a1c20]">{label}</span>
      </div>

      <AppIcon src={IconAssets.IcChevronRight} size="x6" className="opacity-60" />
    </button>
  );
}

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
      <span className="font-pretendard typo-t5medium text-[#1a1c20]">{label}</span>

      <AppIcon src={IconAssets.IcChevronRight} size="x6" className="opacity-60" />
    </button>
  );
}

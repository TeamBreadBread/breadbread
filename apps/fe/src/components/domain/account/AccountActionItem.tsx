import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

interface AccountActionItemProps {
  label: string;
  danger?: boolean;
  showArrow?: boolean;
  onClick?: () => void;
}

export default function AccountActionItem({
  label,
  danger = false,
  showArrow = true,
  onClick,
}: AccountActionItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between bg-white px-x5 py-x6 text-left"
    >
      <span
        className={cn(
          "whitespace-nowrap text-size-4 font-medium leading-t5 tracking-[-0.1px]",
          danger ? "text-[#fa342c]" : "text-[#1a1c20]",
        )}
      >
        {label}
      </span>

      {showArrow ? (
        <AppIcon src={IconAssets.IcChevronRight} size="x6" className="opacity-60" />
      ) : null}
    </button>
  );
}

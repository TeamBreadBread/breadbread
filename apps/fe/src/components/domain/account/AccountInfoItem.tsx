import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

interface AccountInfoItemProps {
  label: string;
  value?: string;
  danger?: boolean;
  showArrow?: boolean;
  onClick?: () => void;
}

export default function AccountInfoItem({
  label,
  value,
  danger = false,
  showArrow = true,
  onClick,
}: AccountInfoItemProps) {
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

      {value !== undefined ? (
        <div className="flex items-center gap-x1">
          <span className="whitespace-nowrap text-size-3 font-medium leading-t4 tracking-[-0.1px] text-[#b0b3ba]">
            {value}
          </span>
          {showArrow ? (
            <AppIcon src={IconAssets.IcChevronRight} size="x6" className="opacity-60" />
          ) : null}
        </div>
      ) : showArrow ? (
        <AppIcon src={IconAssets.IcChevronRight} size="x6" className="opacity-60" />
      ) : null}
    </button>
  );
}

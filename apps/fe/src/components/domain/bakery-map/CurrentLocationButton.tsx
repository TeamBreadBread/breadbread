import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

type CurrentLocationButtonProps = {
  onClick: () => void;
  className?: string;
  disabled?: boolean;
};

export default function CurrentLocationButton({
  onClick,
  className,
  disabled = false,
}: CurrentLocationButtonProps) {
  return (
    <button
      type="button"
      aria-label="현재 위치로 이동"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-x12 w-x12 items-center justify-center rounded-full border border-gray-300 bg-gray-00 shadow-2",
        "transition-opacity disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
    >
      <AppIcon src={IconAssets.IcGps} size={22} className="icon-gray-900" alt="" />
    </button>
  );
}

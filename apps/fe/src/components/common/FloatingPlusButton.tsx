import { AppIcon, IconAssets } from "@/components/icons";

type FloatingPlusButtonProps = {
  onClick: () => void;
  ariaLabel?: string;
};

export default function FloatingPlusButton({
  onClick,
  ariaLabel = "글쓰기",
}: FloatingPlusButtonProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] mx-auto w-full max-w-[744px]">
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className="pointer-events-auto fixed right-[20px] bottom-[76px] z-[60] flex h-[56px] w-[56px] items-center justify-center rounded-full bg-orange-600 shadow-[0_4px_12px_rgba(0,0,0,0.18)] sm:bottom-[80px] md:right-[calc((100vw-744px)/2+20px)]"
      >
        <AppIcon src={IconAssets.IcPlus} size={24} className="brightness-0 invert" alt="" />
      </button>
    </div>
  );
}

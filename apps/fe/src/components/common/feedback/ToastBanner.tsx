import { AppIcon, IconAssets } from "@/components/icons";

interface ToastBannerProps {
  message: string;
  actionText?: string;
  onActionClick?: () => void;
  iconSrc?: string;
  iconClassName?: string;
}

export default function ToastBanner({
  message,
  actionText,
  onActionClick,
  iconSrc,
  iconClassName,
}: ToastBannerProps) {
  return (
    <div className="px-x2">
      <div className="flex items-center gap-x1-5 rounded-r2 bg-[#555d6d] px-[14px] py-x3">
        <AppIcon
          src={iconSrc ?? IconAssets.IcCheckCircle}
          size="x5"
          className={iconClassName ?? "brightness-0 invert"}
        />

        <div className="flex-1 font-pretendard typo-t4regular text-white">{message}</div>

        {actionText ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onActionClick?.();
            }}
            className="font-pretendard typo-t4bold whitespace-nowrap text-white"
          >
            {actionText}
          </button>
        ) : null}
      </div>
    </div>
  );
}

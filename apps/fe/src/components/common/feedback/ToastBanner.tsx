interface ToastBannerProps {
  message: string;
  actionText?: string;
  onActionClick?: () => void;
}

export default function ToastBanner({ message, actionText, onActionClick }: ToastBannerProps) {
  return (
    <div className="px-x2">
      <div className="flex items-center gap-x1 rounded-r2 bg-[#555d6d] px-[14px] py-x3">
        <div className="h-x6 w-x6 rounded-full bg-[#d9dbe0]" />

        <div className="flex-1 font-pretendard typo-t4regular text-white">{message}</div>

        {actionText ? (
          <button
            type="button"
            onClick={onActionClick}
            className="font-pretendard typo-t4bold whitespace-nowrap text-white"
          >
            {actionText}
          </button>
        ) : null}
      </div>
    </div>
  );
}

import { cn } from "@/utils/cn";

type ComingSoonDialogProps = {
  open: boolean;
  message?: string;
  onClose: () => void;
};

export default function ComingSoonDialog({
  open,
  message = "아직 준비중입니다",
  onClose,
}: ComingSoonDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-x5"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="coming-soon-title"
        className={cn(
          "flex w-[300px] flex-col items-start justify-start gap-x6 overflow-hidden rounded-r6 bg-gray-00 p-x6",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col items-center justify-start gap-x1-5">
          <div
            id="coming-soon-title"
            className="w-full text-center font-pretendard text-size-7 font-bold leading-t7 tracking-0 text-gray-1000"
          >
            {message}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="flex w-full flex-row items-center justify-center overflow-hidden rounded-r3 bg-gray-900 px-x4 py-x3-5"
        >
          <span className="whitespace-nowrap text-center font-pretendard text-size-3 font-bold leading-t4 tracking-0 text-gray-00">
            확인
          </span>
        </button>
      </div>
    </div>
  );
}

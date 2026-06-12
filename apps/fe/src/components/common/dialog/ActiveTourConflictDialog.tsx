import { cn } from "@/utils/cn";

type ActiveTourConflictDialogProps = {
  open: boolean;
  onConfirm: () => void;
};

export default function ActiveTourConflictDialog({
  open,
  onConfirm,
}: ActiveTourConflictDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-x5"
      role="presentation"
      onClick={onConfirm}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="active-tour-conflict-title"
        className={cn(
          "flex w-[300px] flex-col items-start justify-start gap-x6 overflow-hidden rounded-r6 bg-gray-00 p-x6",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col items-center justify-start gap-x1-5">
          <div
            id="active-tour-conflict-title"
            className="w-full text-center font-pretendard text-size-7 font-bold leading-t7 tracking-0 text-gray-1000"
          >
            이미 진행중인 코스가있어요!
          </div>
        </div>

        <button
          type="button"
          onClick={onConfirm}
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

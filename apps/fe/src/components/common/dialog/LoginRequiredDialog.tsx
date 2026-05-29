import { cn } from "@/utils/cn";

type LoginRequiredDialogProps = {
  open: boolean;
  onCancel: () => void;
  onLogin: () => void;
};

export default function LoginRequiredDialog({ open, onCancel, onLogin }: LoginRequiredDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-x5"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-required-title"
        className={cn(
          "flex w-[300px] flex-col items-start justify-start gap-x6 overflow-hidden rounded-r6 bg-gray-00 p-x6",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col items-center justify-start gap-x1-5">
          <div
            id="login-required-title"
            className="w-full text-center font-pretendard text-size-7 font-bold leading-t7 tracking-0 text-gray-1000"
          >
            로그인이 필요합니다
          </div>
          <div className="w-full text-center font-pretendard text-size-4 leading-t5 tracking-0 text-gray-1000">
            로그인하고 빵빵을
            <br />더 편하게 이용하세요
          </div>
        </div>

        <div className="flex w-full flex-row items-start justify-center gap-x2-5 overflow-hidden bg-gray-00">
          <button
            type="button"
            onClick={onCancel}
            className="flex flex-1 flex-row items-center justify-center overflow-hidden rounded-r3 bg-gray-200 px-x4 py-x3-5"
          >
            <span className="whitespace-nowrap text-center font-pretendard text-size-3 font-bold leading-t4 tracking-0 text-gray-1000">
              취소
            </span>
          </button>
          <button
            type="button"
            onClick={onLogin}
            className="flex max-w-[300px] flex-1 flex-row items-center justify-center overflow-hidden rounded-r3 bg-gray-900 px-x4 py-x3-5"
          >
            <span className="whitespace-nowrap text-center font-pretendard text-size-3 font-bold leading-t4 tracking-0 text-gray-00">
              로그인
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

import { cn } from "@/utils/cn";

type PreferenceRequiredDialogProps = {
  open: boolean;
  onCancel: () => void;
  onGoToSurvey: () => void;
};

export default function PreferenceRequiredDialog({
  open,
  onCancel,
  onGoToSurvey,
}: PreferenceRequiredDialogProps) {
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
        aria-labelledby="preference-required-title"
        className={cn(
          "flex w-[300px] flex-col items-start justify-start gap-x6 overflow-hidden rounded-r6 bg-gray-00 p-x6",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex w-full flex-col items-center justify-start gap-x1-5">
          <div
            id="preference-required-title"
            className="w-full text-center font-pretendard text-size-7 font-bold leading-t7 tracking-0 text-gray-1000"
          >
            선호도 조사 필요
          </div>
          <div className="w-full text-center font-pretendard text-size-4 leading-t5 tracking-0 text-gray-1000">
            AI 추천을 받으려면 먼저 선호도 조사를 완료해주세요.
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
            onClick={onGoToSurvey}
            className="flex max-w-[300px] flex-1 flex-row items-center justify-center overflow-hidden rounded-r3 bg-gray-900 px-x4 py-x3-5"
          >
            <span className="whitespace-nowrap text-center font-pretendard text-size-3 font-bold leading-t4 tracking-0 text-gray-00">
              선호도 조사 하러 가기
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (carrier: string) => void;
}

const carriers = ["SKT", "KT", "LG U+", "SKT 알뜰폰", "KT 알뜰폰", "LG U+ 알뜰폰"];

export default function BottomSheet({ isOpen, onClose, onSelect }: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="mx-auto flex max-h-[500px] w-full max-w-[744px] flex-col items-start justify-start gap-x3 overflow-hidden rounded-tl-r6 rounded-tr-r6 bg-gray-00">
          <button
            type="button"
            onClick={onClose}
            aria-label="바텀시트 닫기"
            className="relative h-x6 self-stretch shrink-0 overflow-hidden bg-gray-00"
          >
            <div className="absolute left-1/2 top-1/2 h-x1 w-x9 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gray-400" />
          </button>
          <div className="relative self-stretch px-x5 py-0">
            <div className="font-pretendard typo-t7bold text-gray-1000">통신사를 선택해주세요</div>
          </div>
          <div className="self-stretch px-x5 py-0">
            <div className="flex flex-col items-start justify-start w-full">
              {carriers.map((carrier) => (
                <button
                  key={carrier}
                  type="button"
                  onClick={() => {
                    onSelect(carrier);
                    onClose();
                  }}
                  className="flex w-full items-center justify-start overflow-hidden bg-gray-00 px-0 py-x4 hover:bg-gray-200"
                >
                  <div className="font-pretendard typo-t6regular text-left text-gray-1000">
                    {carrier}
                  </div>
                </button>
              ))}
            </div>
          </div>
          <div className="self-stretch flex flex-col items-start justify-start">
            <div className="self-stretch h-x8 shrink-0" />
          </div>
        </div>
      </div>
    </>
  );
}

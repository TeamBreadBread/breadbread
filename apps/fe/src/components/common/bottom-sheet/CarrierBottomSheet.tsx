interface CarrierOption {
  label: string;
  value: string;
}

interface CarrierBottomSheetProps {
  title: string;
  options: CarrierOption[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function CarrierBottomSheet({
  title,
  options,
  selectedValue,
  onSelect,
  isOpen,
  onClose,
}: CarrierBottomSheetProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <button
        type="button"
        aria-label="닫기"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-[744px] rounded-t-[20px] bg-gray-00 px-x5 pb-x5 pt-x4">
        <div className="mb-x4 flex items-center justify-center">
          <div className="h-1.5 w-10 rounded-full bg-gray-300" />
        </div>

        <h2 className="font-pretendard typo-t6medium text-gray-1000">{title}</h2>

        <div className="mt-x4 flex flex-col gap-x1">
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option.value);
                  onClose();
                }}
                className={`font-pretendard typo-t5regular w-full rounded-r3 px-x4 py-x3 text-left ${isSelected ? "bg-gray-200 text-gray-1000" : "bg-gray-00 text-gray-700"}`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

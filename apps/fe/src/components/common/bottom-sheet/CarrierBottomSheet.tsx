import { cn } from "@/utils/cn";

interface BottomSheetOption {
  label: string;
  value: string;
}

interface BottomSheetProps {
  title: string;
  options: BottomSheetOption[];
  selectedValue?: string;
  onSelect?: (value: string) => void;
  className?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function BottomSheet({
  title,
  options,
  selectedValue,
  onSelect,
  className,
  isOpen = false,
  onClose,
}: BottomSheetProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} role="presentation" />

      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <section
          className={cn(
            "max-h-[500px] w-full max-w-[744px] overflow-hidden rounded-t-r6 bg-gray-00",
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex flex-col gap-x3">
            <div className="flex h-x6 items-center justify-center">
              <div className="h-x1 w-x9 rounded-full bg-gray-400" />
            </div>

            <div className="px-x5">
              <h2 className="font-pretendard typo-t7bold text-gray-1000">{title}</h2>
            </div>

            <div className="px-x5 pb-x3">
              <ul className="flex flex-col">
                {options.map((option) => {
                  const isSelected = selectedValue === option.value;

                  return (
                    <li key={option.value} className="border-b border-gray-200 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect?.(option.value);
                          onClose?.();
                        }}
                        className="flex w-full items-center justify-between py-x4 text-left"
                        aria-pressed={isSelected}
                      >
                        <span className="font-pretendard typo-t6regular text-gray-1000">
                          {option.label}
                        </span>

                        <div
                          className={cn(
                            "flex h-x6 w-x6 items-center justify-center rounded-full border",
                            isSelected
                              ? "border-gray-800 bg-gray-800"
                              : "border-gray-400 bg-gray-00",
                          )}
                        >
                          {isSelected ? (
                            <div className="h-x2 w-x2 rounded-full bg-gray-00" />
                          ) : null}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="h-[33px]" />
          </div>
        </section>
      </div>
    </>
  );
}

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
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* BottomSheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
        <section
          className={cn(
            "w-full max-w-[744px] max-h-[500px] overflow-hidden rounded-t-r6 bg-white",
            className,
          )}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="flex flex-col gap-x3">
            <div className="flex h-x6 items-center justify-center">
              <div className="h-[4px] w-[36px] rounded-full bg-[#dcdee3]" />
            </div>

            <div className="px-x5">
              <h2 className="font-pretendard typo-t7bold text-[#1a1c20]">{title}</h2>
            </div>

            <div className="px-x5 pb-x3">
              <ul className="flex flex-col">
                {options.map((option) => {
                  const isSelected = selectedValue === option.value;

                  return (
                    <li key={option.value} className="border-b border-[#f3f4f5] last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelect?.(option.value);
                          onClose?.();
                        }}
                        className="flex w-full items-center justify-between py-x4 text-left"
                        aria-pressed={isSelected}
                      >
                        <span className="font-pretendard typo-t6regular text-[#1a1c20]">
                          {option.label}
                        </span>

                        <div
                          className={cn(
                            "flex h-x6 w-x6 items-center justify-center rounded-full border",
                            isSelected
                              ? "border-[#555d6d] bg-[#555d6d]"
                              : "border-[#dcdee3] bg-white",
                          )}
                        >
                          {isSelected ? (
                            <div className="h-[8px] w-[8px] rounded-full bg-white" />
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

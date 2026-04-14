import { cn } from "@/utils/cn";

interface BottomCTAProps {
  text: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function BottomCTA({ text, disabled = true, onClick }: BottomCTAProps) {
  return (
    <div className="sticky bottom-0 bg-white">
      <div className="h-x12 bg-gradient-to-b from-transparent to-gray-00" />
      <div className="border-t border-gray-300 bg-white px-x5 py-x3">
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className={cn(
            "font-pretendard typo-t6bold flex h-x14 w-full items-center justify-center rounded-r3",
            disabled ? "bg-gray-200 text-gray-500" : "bg-gray-800 text-white",
          )}
        >
          {text}
        </button>
      </div>
    </div>
  );
}

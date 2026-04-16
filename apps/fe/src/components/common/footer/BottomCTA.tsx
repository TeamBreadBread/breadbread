import { Button } from "@/components/common/Button";
import { cn } from "@/utils/cn";

interface BottomCTAProps {
  text: string;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function BottomCTA({ text, disabled = false, onClick, className }: BottomCTAProps) {
  return (
    <footer className={cn("w-full border-t border-gray-300 px-x5 py-x4", className)}>
      <Button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "h-x14 w-full rounded-r3 bg-gray-800 px-x5 py-x4",
          "text-size-7 font-bold leading-t8 tracking-2 text-white",
          "disabled:bg-gray-400",
        )}
      >
        {text}
      </Button>
    </footer>
  );
}

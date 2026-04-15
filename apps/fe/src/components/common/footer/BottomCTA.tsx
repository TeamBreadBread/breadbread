import { Button } from "@/components/common/Button";

interface BottomCTAProps {
  text: string;
  disabled?: boolean;
  onClick?: () => void;
}

export default function BottomCTA({ text, disabled = false, onClick }: BottomCTAProps) {
  return (
    <footer className="w-full border-t border-gray-300 px-x5 py-x4">
      <Button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="h-14 w-full rounded-r3 bg-gray-800 px-x5 py-x4 text-size-7 font-bold leading-t8 tracking-2 text-white disabled:bg-gray-400"
      >
        {text}
      </Button>
    </footer>
  );
}

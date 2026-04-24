import { Button } from "@/components/common/Button";

interface BottomCTAProps {
  text: string;
  onClick?: () => void;
  className?: string;
}

export default function BottomCTA({ text, onClick, className }: BottomCTAProps) {
  return (
    <Button
      className={
        className ?? "h-14 w-full rounded-r3 bg-gray-800 text-size-5 font-bold text-gray-00"
      }
      onClick={onClick}
    >
      {text}
    </Button>
  );
}

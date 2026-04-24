import { cn } from "@/utils/cn";

interface AuthLinkRowProps {
  leftText: string;
  rightText: string;
  onLeftClick?: () => void;
  onRightClick?: () => void;
}

const linkClassName = cn(
  "whitespace-nowrap text-size-3 font-medium leading-t4 tracking-1 text-gray-700",
);

export default function AuthLinkRow({
  leftText,
  rightText,
  onLeftClick,
  onRightClick,
}: AuthLinkRowProps) {
  return (
    <div className="flex items-center justify-center gap-x3">
      <button type="button" onClick={onLeftClick} className={linkClassName}>
        {leftText}
      </button>

      <span className="whitespace-nowrap text-size-3 font-normal leading-t4 tracking-1 text-gray-500">
        |
      </span>

      <button type="button" onClick={onRightClick} className={linkClassName}>
        {rightText}
      </button>
    </div>
  );
}

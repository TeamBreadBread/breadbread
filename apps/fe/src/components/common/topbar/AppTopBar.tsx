import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";

interface AppTopBarProps {
  title: string;
}

export default function AppTopBar({ title }: AppTopBarProps) {
  const navigate = useNavigate();

  return (
    <header className="relative flex h-14 shrink-0 items-center justify-between border-b border-gray-300 px-x5 py-x2-5">
      <button
        type="button"
        onClick={() => navigate({ to: "/" })}
        className="flex size-9 items-center justify-center"
        aria-label="뒤로 가기"
      >
        <img src={ArrowLeft} alt="" className="size-6" />
      </button>

      <span className="absolute left-1/2 -translate-x-1/2 text-size-5 font-bold leading-t6 tracking-[-0.1px] text-gray-1000">
        {title}
      </span>

      <div className="size-9" />
    </header>
  );
}

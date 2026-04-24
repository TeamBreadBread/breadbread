import { cn } from "@/utils/cn";

interface ResultTopBarProps {
  title: string;
}

export default function ResultTopBar({ title }: ResultTopBarProps) {
  const backButtonClass = cn(
    "flex h-9 w-9 items-center justify-center",
    "rounded-full",
    "text-size-5 leading-t6 font-medium tracking-2",
    "text-gray-1000",
    "hover:bg-gray-100 transition-colors duration-150",
  );

  const titleClass = cn("text-size-5 leading-t6 font-bold tracking-2", "text-gray-1000");

  return (
    <header className="sticky top-0 z-10 bg-gray-00">
      <div
        className={cn(
          "flex h-14 items-center justify-between",
          "border-b border-gray-300",
          "px-x5",
        )}
      >
        <button type="button" aria-label="뒤로 가기" className={backButtonClass}>
          &lt;
        </button>

        <h1 className={titleClass}>{title}</h1>

        <div className="h-9 w-9 rounded-full bg-gray-400" aria-hidden />
      </div>
    </header>
  );
}

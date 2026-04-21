import ArrowLeft from "@/assets/icons/ArrowLeft.svg";

interface AppTopBarProps {
  title: string;
  centered?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export default function AppTopBar({
  title,
  centered = false,
  showBackButton = false,
  onBackClick,
}: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center border-b border-[#eeeff1] bg-white px-x5 relative">
      {showBackButton ? (
        <button
          type="button"
          onClick={onBackClick}
          className="flex h-9 w-9 items-center justify-center"
          aria-label="뒤로 가기"
        >
          <img src={ArrowLeft} alt="" className="h-6 w-6" />
        </button>
      ) : null}

      <h1
        className={`text-size-5 font-bold leading-t6 tracking-[-0.1px] text-[#1a1c20] ${
          centered ? "absolute left-1/2 -translate-x-1/2" : "ml-0"
        }`}
      >
        {title}
      </h1>
    </header>
  );
}

interface AppTopBarProps {
  title: string;
}

export default function AppTopBar({ title }: AppTopBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-white">
      <div className="relative flex h-14 items-center justify-between border-b border-[#eeeff1] px-x5">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center"
          aria-label="뒤로 가기"
        >
          <span className="text-xl leading-none text-[#1a1c20]">&lt;</span>
        </button>
        <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-pretendard text-[18px] font-bold leading-[24px] tracking-[-0em] text-[#1a1c20]">
          {title}
        </h1>
        <div className="h-6 w-6 rounded-full bg-[#dcdee3]" aria-hidden />
      </div>
    </header>
  );
}

import ArrowLeftIcon from "@/assets/icons/ArrowLeft.svg";

interface PreferenceTopBarProps {
  title: string;
}

export default function PreferenceTopBar({ title }: PreferenceTopBarProps) {
  return (
    <header className="sticky top-0 z-10 bg-gray-00">
      <div className="relative flex h-x14 items-center justify-between overflow-hidden border-b border-gray-300 bg-gray-00 px-x5 py-x2-5">
        <button
          type="button"
          aria-label="뒤로가기"
          onClick={() => window.history.back()}
          className="flex h-x9 w-x9 items-center justify-center rounded-full hover:bg-gray-100"
        >
          <img src={ArrowLeftIcon} alt="" aria-hidden="true" className="h-x4 w-x4" />
        </button>

        <div className="h-9 w-9" />

        <h1 className="font-sans text-size-6 leading-t6 font-bold tracking-2 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap text-center text-gray-1000 cursor-default select-none">
          {title}
        </h1>
      </div>
    </header>
  );
}

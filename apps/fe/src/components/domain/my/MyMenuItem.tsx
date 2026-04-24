interface MyMenuItemProps {
  label: string;
  onClick?: () => void;
}

export default function MyMenuItem({ label, onClick }: MyMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between bg-white px-x5 py-x6 text-left"
    >
      <div className="flex items-center gap-[6px]">
        <div className="h-x6 w-x6 rounded-full bg-[#d9dbe0]" />
        <span className="font-pretendard typo-t5medium text-[#1a1c20]">{label}</span>
      </div>

      <div className="h-x6 w-x6 rounded-full bg-[#d9dbe0]" />
    </button>
  );
}

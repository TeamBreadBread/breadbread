interface BottomNavItem {
  label: string;
  active?: boolean;
}

interface BottomNavProps {
  items: BottomNavItem[];
}

export default function BottomNav({ items }: BottomNavProps) {
  return (
    <div className="sticky bottom-0 z-20 flex flex-col justify-end">
      <div className="flex h-14 items-center justify-center border-t border-[#eeeff1] bg-white">
        {items.map((item) => (
          <div key={item.label} className="flex flex-1 flex-col items-center justify-center gap-x1">
            <div className="flex items-center justify-center p-[3px]">
              <div
                className={`h-[18px] w-[18px] rounded-full ${
                  item.active ? "bg-[#1a1c20]" : "bg-[#b0b3ba]"
                }`}
              />
            </div>

            <div
              className={`font-pretendard text-center text-[11px] font-medium leading-[15px] ${
                item.active ? "text-[#1a1c20]" : "text-[#868b94]"
              }`}
            >
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

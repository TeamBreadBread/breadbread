import { useNavigate } from "@tanstack/react-router";
import type { BottomTabItem } from "./types";

const bottomTabs: BottomTabItem[] = [
  { label: "홈", to: "/home" },
  { label: "루트", to: "/route" },
  { label: "빵터", to: "/bbangteo" },
  { label: "MY", to: "/my" },
];

const CircleIcon = ({ size, color }: { size: number; color: string }) => {
  return (
    <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
  );
};

type BbangteoBottomNavigationProps = {
  activeTab: string;
};

const BbangteoBottomNavigation = ({ activeTab }: BbangteoBottomNavigationProps) => {
  const navigate = useNavigate();

  return (
    <nav className="h-[56px] shrink-0">
      <div className="flex h-[56px] items-center justify-center border-t border-[#eeeff1] bg-white">
        {bottomTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => navigate({ to: tab.to })}
            className="flex h-full max-w-[120px] flex-1 flex-col items-center justify-center gap-[4px]"
          >
            <CircleIcon size={18} color={tab.label === activeTab ? "#1a1c20" : "#b0b3ba"} />
            <span
              className={`text-center text-[11px] leading-[15px] font-medium ${
                tab.label === activeTab ? "text-[#1a1c20]" : "text-[#868b94]"
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BbangteoBottomNavigation;

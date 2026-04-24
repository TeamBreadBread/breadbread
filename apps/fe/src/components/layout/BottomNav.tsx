import BottomNavItem from "./BottomNavItem";
import { APP_SHELL_MAX_WIDTH } from "./layout.constants";

type NavItem = {
  label: string;
  active?: boolean;
};

const navItems: NavItem[] = [
  { label: "홈", active: true },
  { label: "루트" },
  { label: "빵터" },
  { label: "MY" },
];

const BottomNav = () => {
  return (
    <nav
      className={`fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 border-t border-gray-300 bg-gray-00 ${APP_SHELL_MAX_WIDTH}`}
    >
      <div className="flex h-[56px] sm:h-[60px]">
        {navItems.map((item) => (
          <BottomNavItem key={item.label} label={item.label} active={item.active} />
        ))}
      </div>

      <div className="relative h-[34px] bg-gray-00 md:hidden">
        <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-full bg-gray-1000" />
      </div>
    </nav>
  );
};

export default BottomNav;

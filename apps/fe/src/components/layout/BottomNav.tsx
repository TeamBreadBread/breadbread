import { useLocation, useNavigate } from "@tanstack/react-router";
import BottomNavItem from "./BottomNavItem";
import { APP_SHELL_MAX_WIDTH } from "./layout.constants";

type NavItem = {
  label: string;
  to?: "/home" | "/route" | "/my";
};

const navItems: NavItem[] = [
  { label: "홈", to: "/home" },
  { label: "루트", to: "/route" },
  { label: "빵터" },
  { label: "MY", to: "/my" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav
      className={`fixed bottom-0 left-1/2 z-50 w-full -translate-x-1/2 border-t border-gray-300 bg-gray-00 ${APP_SHELL_MAX_WIDTH}`}
    >
      <div className="flex h-[56px] sm:h-[60px]">
        {navItems.map((item) => (
          <BottomNavItem
            key={item.label}
            label={item.label}
            active={item.to ? pathname === item.to : false}
            onClick={item.to ? () => navigate({ to: item.to }) : undefined}
          />
        ))}
      </div>

      <div className="relative h-[34px] bg-gray-00 md:hidden">
        <div className="absolute bottom-[8px] left-1/2 h-[5px] w-[144px] -translate-x-1/2 rounded-full bg-gray-1000" />
      </div>
    </nav>
  );
};

export default BottomNav;

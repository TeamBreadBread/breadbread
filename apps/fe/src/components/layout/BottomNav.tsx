import { useLocation, useNavigate } from "@tanstack/react-router";
import BottomNavItem from "./BottomNavItem";
import { APP_SHELL_MAX_WIDTH } from "./layout.constants";

type NavItem = {
  label: string;
  to?: "/home" | "/route" | "/bbangteo" | "/my";
};

const navItems: NavItem[] = [
  { label: "홈", to: "/home" },
  { label: "루트", to: "/route" },
  { label: "빵터", to: "/bbangteo" },
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
        {navItems.map((item) => {
          const to = item.to;
          const isActive =
            to === "/bbangteo"
              ? pathname === "/bbangteo" ||
                pathname.startsWith("/bbangteo-") ||
                pathname.startsWith("/bbangteo/")
              : to
                ? pathname === to || pathname.startsWith(`${to}/`)
                : false;
          return (
            <BottomNavItem
              key={item.label}
              label={item.label}
              active={isActive}
              onClick={to ? () => navigate({ to }) : undefined}
            />
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

import { AppIcon, IconAssets } from "@/components/icons";
import { useLocation, useNavigate } from "@tanstack/react-router";
import { isBotFloatingHiddenPath } from "@/lib/courseGuide";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";
import BottomNavItem from "./BottomNavItem";
import { APP_SHELL_MAX_WIDTH } from "./layout.constants";

type NavItem = {
  label: string;
  icon: string;
  to?: "/home" | "/route" | "/bbangteo" | "/my";
};

const navItems: NavItem[] = [
  { label: "홈", icon: IconAssets.IcHome, to: "/home" },
  { label: "루트", icon: IconAssets.IcCompass, to: "/route" },
  { label: "빵터", icon: IconAssets.IcChat, to: "/bbangteo" },
  { label: "MY", icon: IconAssets.IcPerson, to: "/my" },
];

const BottomNav = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { requireLogin, courseGuideActive } = useLoginRequired();

  const showRouteGuideTooltip = courseGuideActive && isBotFloatingHiddenPath(pathname);

  const handleNavClick = (to: NavItem["to"]) => {
    if (!to) return;
    if (to === "/my" || to === "/route") {
      requireLogin(() => {
        void navigate({ to });
      }, to);
      return;
    }
    void navigate({ to });
  };

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
              tooltip={to === "/route" && showRouteGuideTooltip ? "안내 중" : undefined}
              icon={
                <AppIcon src={item.icon} size={24} color={isActive ? "gray-900" : "gray-500"} />
              }
              onClick={to ? () => handleNavClick(to) : undefined}
            />
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;

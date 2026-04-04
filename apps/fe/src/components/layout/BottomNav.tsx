import { cn } from "@/utils/cn";

type NavItem = {
  id: string;
  label: string;
  icon: string;
  href: string;
};

const navItems: NavItem[] = [
  { id: "home", label: "홈", icon: "🏠", href: "/" },
  { id: "ai-course", label: "AI 코스", icon: "🤖", href: "/ai-course" },
  { id: "mypage", label: "마이페이지", icon: "👤", href: "/mypage" },
];

type BottomNavProps = {
  activePath?: string;
  className?: string;
};

const BottomNav = ({ activePath = "/", className }: BottomNavProps) => {
  return (
    <nav
      className={cn(
        "sticky bottom-0 z-10 flex h-x16 items-center justify-around border-t border-gray-300 bg-gray-00 px-x2",
        className,
      )}
    >
      {navItems.map((item) => {
        const isActive = activePath === item.href;
        return (
          <a
            key={item.id}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-x0-5 py-x1-5",
              isActive ? "text-gray-1000" : "text-gray-600",
            )}
          >
            <span className="text-size-6 leading-none">{item.icon}</span>
            <span
              className={cn(
                "text-size-0 leading-t1 tracking-0",
                isActive ? "font-bold" : "font-medium",
              )}
            >
              {item.label}
            </span>
          </a>
        );
      })}
    </nav>
  );
};

export default BottomNav;

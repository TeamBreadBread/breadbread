import { Link } from "@tanstack/react-router";
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
  className?: string;
};

const BottomNav = ({ className }: BottomNavProps) => {
  return (
    <nav
      className={cn(
        "sticky bottom-0 z-10 flex h-x16 items-center justify-around border-t border-gray-300 bg-gray-00 px-x2",
        className,
      )}
    >
      {navItems.map((item) => (
        <Link
          key={item.id}
          to={item.href}
          className="flex flex-col items-center gap-x0-5 py-x1-5 text-gray-600"
          activeProps={{ className: "flex flex-col items-center gap-x0-5 py-x1-5 text-gray-1000" }}
          activeOptions={{ exact: true }}
        >
          <span className="text-size-6 leading-none">{item.icon}</span>
          <span className="text-size-0 font-medium leading-t1 tracking-0">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default BottomNav;

// 오른쪽 4개 카드 묶음
import { useNavigate } from "@tanstack/react-router";
import QuickMenuCard from "@/components/common/cards/QuickMenuCard";
import { QUICK_MENU_CATEGORIES } from "./quickMenuCategories";

const QuickMenuGrid = () => {
  const navigate = useNavigate();

  return (
    <div className="grid flex-1 grid-cols-2 justify-items-center gap-[9px]">
      {QUICK_MENU_CATEGORIES.map((menu) => (
        <QuickMenuCard
          key={menu.label}
          label={menu.label}
          imageSrc={menu.imageSrc}
          onClick={() => navigate({ to: menu.to })}
        />
      ))}
    </div>
  );
};

export default QuickMenuGrid;

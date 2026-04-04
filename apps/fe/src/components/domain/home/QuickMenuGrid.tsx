// 오른쪽 4개 카드 묶음
import QuickMenuCard from "@/components/common/cards/QuickMenuCard";

const quickMenus = [
  { label: "지역별" },
  { label: "종류별" },
  { label: "에디터픽" },
  { label: "테마별" },
];

const QuickMenuGrid = () => {
  return (
    <div className="grid flex-1 grid-cols-2 gap-[9px]">
      {quickMenus.map((menu) => (
        <QuickMenuCard key={menu.label} label={menu.label} />
      ))}
    </div>
  );
};

export default QuickMenuGrid;

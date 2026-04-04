import { cn } from "@/utils/cn";

export type QuickMenuItem = {
  id: string;
  label: string;
  icon: string;
  onClick?: () => void;
};

type QuickMenuProps = {
  items: QuickMenuItem[];
  className?: string;
};

const QuickMenu = ({ items, className }: QuickMenuProps) => {
  return (
    <div className={cn("grid grid-cols-4 gap-x4 px-x4", className)}>
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.onClick}
          className="flex flex-col items-center gap-x1-5"
        >
          <div className="flex h-x13 w-x13 items-center justify-center rounded-r3 bg-gray-100">
            <span className="text-size-7 leading-none">{item.icon}</span>
          </div>
          <span className="text-size-1 font-medium leading-t2 tracking-0 text-gray-800">
            {item.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default QuickMenu;

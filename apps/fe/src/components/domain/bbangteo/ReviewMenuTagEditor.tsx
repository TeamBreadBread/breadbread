import type { BakeryDetailBread, BreadTagType } from "@/api/types/bakery";
import BreadTagSelector from "@/components/domain/bbangteo/BreadTagSelector";
import { cn } from "@/utils/cn";
import { MAX_REVIEW_MENU_SELECT } from "@/utils/bakeryTagLabels";

export type ReviewMenuTagEntry = {
  breadId: number;
  breadName: string;
  tags: BreadTagType[];
};

type ReviewMenuTagEditorProps = {
  menus: Pick<BakeryDetailBread, "id" | "name">[];
  value: ReviewMenuTagEntry[];
  onChange: (next: ReviewMenuTagEntry[]) => void;
  disabled?: boolean;
  className?: string;
};

export default function ReviewMenuTagEditor({
  menus,
  value,
  onChange,
  disabled = false,
  className,
}: ReviewMenuTagEditorProps) {
  const selectedIds = new Set(value.map((entry) => entry.breadId));

  const handleToggleMenu = (menu: Pick<BakeryDetailBread, "id" | "name">) => {
    if (disabled) return;
    if (selectedIds.has(menu.id)) {
      onChange(value.filter((entry) => entry.breadId !== menu.id));
      return;
    }
    if (value.length >= MAX_REVIEW_MENU_SELECT) return;
    onChange([...value, { breadId: menu.id, breadName: menu.name, tags: [] }]);
  };

  const handleMenuTagsChange = (breadId: number, tags: BreadTagType[]) => {
    onChange(value.map((entry) => (entry.breadId === breadId ? { ...entry, tags } : entry)));
  };

  if (menus.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-[16px]", className)}>
      <div className="flex flex-col gap-[8px]">
        <div className="flex flex-col gap-[2px]">
          <span className="text-[14px] leading-[19px] font-semibold text-[#1a1c20]">
            어떤 메뉴를 먹어봤나요?
          </span>
          <span className="text-[12px] leading-[17px] text-[#868b94]">
            최대 {MAX_REVIEW_MENU_SELECT}개까지 선택할 수 있어요.
          </span>
        </div>
        <div className="flex flex-wrap gap-[8px]">
          {menus.map((menu) => {
            const isSelected = selectedIds.has(menu.id);
            const isDisabledOption =
              disabled || (!isSelected && value.length >= MAX_REVIEW_MENU_SELECT);
            return (
              <button
                key={menu.id}
                type="button"
                aria-pressed={isSelected}
                disabled={isDisabledOption}
                onClick={() => handleToggleMenu(menu)}
                className={cn(
                  "inline-flex shrink-0 items-center rounded-full border px-[12px] py-[7px] text-[13px] leading-[18px] font-medium transition-colors",
                  isSelected
                    ? "border-[#E8623A] bg-[#FFF0EB] text-[#1a1c20]"
                    : "border-[#dcdee3] bg-white text-[#4d5159]",
                  isDisabledOption && !isSelected && "cursor-not-allowed opacity-40",
                )}
              >
                {menu.name}
              </button>
            );
          })}
        </div>
      </div>

      {value.map((entry) => (
        <BreadTagSelector
          key={entry.breadId}
          label={`${entry.breadName}의 맛은 어땠나요?`}
          selected={entry.tags}
          onChange={(tags) => handleMenuTagsChange(entry.breadId, tags)}
          disabled={disabled}
        />
      ))}
    </div>
  );
}

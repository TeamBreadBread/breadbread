import type { BakeryTagType } from "@/api/types/bakery";
import TagChipSelector from "@/components/domain/bbangteo/TagChipSelector";
import {
  ALL_BAKERY_TAG_OPTIONS,
  formatBakeryTagLabel,
  MAX_BAKERY_TAG_SELECT,
} from "@/utils/bakeryTagLabels";

type BakeryTagSelectorProps = {
  label?: string;
  hint?: string;
  selected: BakeryTagType[];
  onChange: (next: BakeryTagType[]) => void;
  disabled?: boolean;
  className?: string;
};

export default function BakeryTagSelector({
  label = "이 빵집은 어떤 분위기였나요?",
  hint = `최대 ${MAX_BAKERY_TAG_SELECT}개까지 선택할 수 있어요.`,
  selected,
  onChange,
  disabled = false,
  className,
}: BakeryTagSelectorProps) {
  return (
    <TagChipSelector
      label={label}
      hint={hint}
      options={ALL_BAKERY_TAG_OPTIONS}
      selected={selected}
      maxCount={MAX_BAKERY_TAG_SELECT}
      onChange={onChange}
      formatLabel={formatBakeryTagLabel}
      disabled={disabled}
      className={className}
    />
  );
}

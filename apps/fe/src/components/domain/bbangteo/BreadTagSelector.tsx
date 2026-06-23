import type { BreadTagType } from "@/api/types/bakery";
import TagChipSelector from "@/components/domain/bbangteo/TagChipSelector";
import {
  ALL_BREAD_TAG_OPTIONS,
  formatBreadTagLabel,
  MAX_BREAD_TAG_SELECT,
} from "@/utils/bakeryTagLabels";

type BreadTagSelectorProps = {
  label: string;
  selected: BreadTagType[];
  onChange: (next: BreadTagType[]) => void;
  disabled?: boolean;
  className?: string;
};

export default function BreadTagSelector({
  label,
  selected,
  onChange,
  disabled = false,
  className,
}: BreadTagSelectorProps) {
  return (
    <TagChipSelector
      label={label}
      hint={`최대 ${MAX_BREAD_TAG_SELECT}개까지 선택할 수 있어요.`}
      options={ALL_BREAD_TAG_OPTIONS}
      selected={selected}
      maxCount={MAX_BREAD_TAG_SELECT}
      onChange={onChange}
      formatLabel={formatBreadTagLabel}
      disabled={disabled}
      className={className}
    />
  );
}

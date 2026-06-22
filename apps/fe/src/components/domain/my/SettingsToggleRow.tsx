import { cn } from "@/utils/cn";

type SettingsToggleRowProps = {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function SettingsToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: SettingsToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-x3 bg-white px-x5 py-x4 dark:bg-[#1f2429]">
      <div className="min-w-0 flex-1">
        <p className="font-pretendard typo-t5medium text-[#1a1c20] dark:text-gray-100">{label}</p>
        {description ? (
          <p className="mt-x0.5 font-pretendard typo-t3regular text-[#868b94] dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "box-border flex h-[28px] w-[48px] shrink-0 items-center overflow-hidden rounded-full p-[2px] transition-colors disabled:opacity-50",
          checked ? "bg-orange-600" : "bg-[#d1d3d8] dark:bg-gray-600",
        )}
      >
        <span
          className={cn(
            "block h-[24px] w-[24px] shrink-0 rounded-full bg-white shadow transition-transform duration-200 ease-out",
            checked ? "translate-x-[20px]" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}

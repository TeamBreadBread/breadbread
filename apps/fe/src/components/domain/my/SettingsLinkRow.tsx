import { AppIcon, IconAssets } from "@/components/icons";

type SettingsLinkRowProps = {
  label: string;
  description?: string;
  onClick?: () => void;
  danger?: boolean;
};

export default function SettingsLinkRow({
  label,
  description,
  onClick,
  danger = false,
}: SettingsLinkRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between bg-white px-x5 py-x4 text-left dark:bg-[#1f2429]"
    >
      <div className="min-w-0 flex-1 pr-x3">
        <p
          className={
            danger
              ? "font-pretendard typo-t5medium text-red-600"
              : "font-pretendard typo-t5medium text-[#1a1c20] dark:text-gray-100"
          }
        >
          {label}
        </p>
        {description ? (
          <p className="mt-x0.5 font-pretendard typo-t3regular text-[#868b94] dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
      {!danger ? (
        <AppIcon src={IconAssets.IcChevronRight} size="x6" color="gray-500" className="shrink-0" />
      ) : null}
    </button>
  );
}

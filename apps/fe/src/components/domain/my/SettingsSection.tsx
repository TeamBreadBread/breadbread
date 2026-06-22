import type { ReactNode } from "react";

type SettingsSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export default function SettingsSection({ title, description, children }: SettingsSectionProps) {
  return (
    <section className="w-full">
      <div className="bg-[#f3f4f5] px-x5 py-x3 dark:bg-[#14181c]">
        <h2 className="font-pretendard typo-t4bold text-[#1a1c20] dark:text-gray-100">{title}</h2>
        {description ? (
          <p className="mt-x0.5 font-pretendard typo-t3regular text-[#868b94] dark:text-gray-400">
            {description}
          </p>
        ) : null}
      </div>
      <div className="divide-y divide-[#f3f4f5] dark:divide-[#2a3038]">{children}</div>
    </section>
  );
}

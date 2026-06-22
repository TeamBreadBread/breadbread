import { useState } from "react";
import { AppIcon, IconAssets } from "@/components/icons";
import { cn } from "@/utils/cn";

type FaqAccordionItemProps = {
  question: string;
  answer: string;
};

export default function FaqAccordionItem({ question, answer }: FaqAccordionItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[#f3f4f5] bg-white last:border-b-0 dark:border-[#2a3038] dark:bg-[#1f2429]">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-x3 px-x5 py-x4 text-left"
      >
        <span className="font-pretendard typo-t5medium text-[#1a1c20] dark:text-gray-100">
          {question}
        </span>
        <AppIcon
          src={IconAssets.IcChevronDown}
          size="x5"
          color="gray-500"
          className={cn("shrink-0 transition-transform", open && "rotate-180")}
          alt=""
        />
      </button>
      {open ? (
        <div className="px-x5 pb-x4">
          <p className="font-pretendard typo-t4regular leading-relaxed text-[#555d6d] dark:text-gray-300">
            {answer}
          </p>
        </div>
      ) : null}
    </div>
  );
}

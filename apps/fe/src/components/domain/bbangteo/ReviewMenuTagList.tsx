import type { BakeryReviewMenuTag } from "@/api/types/bakery";
import { formatBreadTagLabel, normalizeBreadTags } from "@/utils/bakeryTagLabels";
import { cn } from "@/utils/cn";

type ReviewMenuTagListProps = {
  menuTags?: BakeryReviewMenuTag[] | null;
  className?: string;
};

export default function ReviewMenuTagList({ menuTags, className }: ReviewMenuTagListProps) {
  const entries = (menuTags ?? []).filter(
    (entry) => entry.breadId > 0 && normalizeBreadTags(entry.tags).length > 0,
  );
  if (entries.length === 0) return null;

  return (
    <div className={cn("flex flex-col gap-[6px]", className)}>
      {entries.map((entry) => {
        const tags = normalizeBreadTags(entry.tags);
        const breadName = entry.breadName?.trim() || `메뉴 #${entry.breadId}`;
        return (
          <p
            key={entry.breadId}
            className="flex flex-wrap items-baseline gap-x-[6px] gap-y-[2px] text-[13px] leading-[18px]"
          >
            <span className="font-medium text-[#1a1c20]">{breadName}</span>
            {tags.map((tag) => (
              <span key={tag} className="font-medium text-[#555d6d]">
                #{formatBreadTagLabel(tag)}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

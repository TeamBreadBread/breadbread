import type { BakeryReview } from "@/api/types/bakery";
import { BakeryTagBadgeRow } from "@/components/domain/bbangteo/BakeryTagBadges";
import ReviewMenuTagList from "@/components/domain/bbangteo/ReviewMenuTagList";
import { normalizeBakeryTags } from "@/utils/bakeryTagLabels";
import { cn } from "@/utils/cn";

type ReviewTagsSectionProps = {
  review: Pick<BakeryReview, "bakeryTags" | "menuTags">;
  className?: string;
};

export default function ReviewTagsSection({ review, className }: ReviewTagsSectionProps) {
  const bakeryTags = normalizeBakeryTags(review.bakeryTags);
  const hasMenuTags = (review.menuTags ?? []).some((entry) => (entry.tags?.length ?? 0) > 0);

  if (bakeryTags.length === 0 && !hasMenuTags) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-[10px]", className)}>
      {bakeryTags.length > 0 ? (
        <div className="flex flex-col gap-[6px]">
          <span className="text-[12px] leading-[16px] font-semibold text-[#868b94]">빵집 느낌</span>
          <BakeryTagBadgeRow tags={bakeryTags} />
        </div>
      ) : null}
      {hasMenuTags ? (
        <div className="flex flex-col gap-[6px]">
          <span className="text-[12px] leading-[16px] font-semibold text-[#868b94]">
            먹어본 메뉴
          </span>
          <ReviewMenuTagList menuTags={review.menuTags} />
        </div>
      ) : null}
    </div>
  );
}

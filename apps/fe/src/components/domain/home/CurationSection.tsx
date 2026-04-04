import { cn } from "@/utils/cn";
import { SectionHeader } from "@/components/common";
import CurationCard, { type CurationCardData } from "./CurationCard";

type CurationSectionProps = {
  title: string;
  items: CurationCardData[];
  onMoreClick?: () => void;
  className?: string;
};

const CurationSection = ({ title, items, onMoreClick, className }: CurationSectionProps) => {
  return (
    <section className={cn("flex flex-col gap-x3", className)}>
      <div className="px-x4">
        <SectionHeader
          title={title}
          actionLabel={onMoreClick ? "더보기" : undefined}
          onActionClick={onMoreClick}
        />
      </div>

      <div className="flex gap-x3 overflow-x-auto px-x4 pb-x2 [&::-webkit-scrollbar]:hidden">
        {items.map((item) => (
          <CurationCard key={item.id} data={item} />
        ))}
      </div>
    </section>
  );
};

export default CurationSection;

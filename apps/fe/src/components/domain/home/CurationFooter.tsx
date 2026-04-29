import CurationCard from "@/components/common/cards/CurationCard";
import { cn } from "@/utils/cn";

type CurationItem = {
  title: string;
  address: string;
  rate: number;
};

type CurationFooterProps = {
  items?: CurationItem[];
  itemClassName?: string;
  cardImageClassName?: string;
  breadIconClassName?: string;
  onItemClick?: (item: CurationItem, index: number) => void;
};

const CurationFooter = ({
  items = [
    { title: "빵집 이름 1", address: "소제동", rate: 4.5 },
    { title: "빵집 이름 2", address: "소제동", rate: 4.8 },
    { title: "빵집 이름 3", address: "은행동", rate: 4.2 },
    { title: "빵집 이름 4", address: "대흥동", rate: 4.9 },
  ],
  itemClassName,
  cardImageClassName,
  breadIconClassName,
  onItemClick,
}: CurationFooterProps) => {
  return (
    <div className="h-full w-full overflow-x-auto">
      <div className="flex gap-[var(--spacing-x4)] w-max">
        {items.map((item, index) => (
          <div
            key={`${item.title}-${item.address}-${index}`}
            className={cn("flex-shrink-0", "w-[254px] h-[240px]", itemClassName)}
          >
            {onItemClick ? (
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onItemClick(item, index)}
              >
                <CurationCard
                  title={item.title}
                  address={item.address}
                  rate={item.rate}
                  imageClassName={cardImageClassName}
                  breadIconClassName={breadIconClassName}
                />
              </button>
            ) : (
              <CurationCard
                title={item.title}
                address={item.address}
                rate={item.rate}
                imageClassName={cardImageClassName}
                breadIconClassName={breadIconClassName}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CurationFooter;

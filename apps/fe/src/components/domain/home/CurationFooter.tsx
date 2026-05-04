import CurationCard from "@/components/common/cards/CurationCard";
import { cn } from "@/utils/cn";

export type CurationItem = {
  bakeryId?: number;
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
  items = [],
  itemClassName,
  cardImageClassName,
  breadIconClassName,
  onItemClick,
}: CurationFooterProps) => {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[240px] w-full items-center justify-center rounded-[var(--radius-r3)] bg-[var(--color-gray-200)] px-4 text-center text-[length:var(--font-size-3)] text-[var(--color-gray-600)]">
        표시할 빵집이 없어요
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden">
      <div className="flex w-max gap-[var(--spacing-x4)]">
        {items.map((item, index) => (
          <div
            key={item.bakeryId ?? `${item.title}-${item.address}-${index}`}
            className={cn("w-[254px] flex-shrink-0 self-start", itemClassName)}
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

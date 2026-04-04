import { cn } from "@/utils/cn";

export type CurationCardData = {
  id: string;
  title: string;
  description?: string;
  imageUrl?: string;
  tag?: string;
};

type CurationCardProps = {
  data: CurationCardData;
  className?: string;
};

const CurationCard = ({ data, className }: CurationCardProps) => {
  const { title, description, imageUrl, tag } = data;

  return (
    <div
      className={cn(
        "flex w-[160px] flex-none flex-col overflow-hidden rounded-r3 bg-gray-100 shadow-1",
        className,
      )}
    >
      <div className="relative h-[100px] w-full overflow-hidden bg-gray-300">
        {imageUrl ? (
          <img src={imageUrl} alt={title} className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <div className="h-full w-full bg-gray-300" />
        )}
        {tag && (
          <span className="absolute left-x2 top-x2 rounded-r1 bg-gray-1000/70 px-x1-5 py-x0-5 text-size-0 leading-t1 font-medium tracking-0 text-gray-00">
            {tag}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-x0-5 p-x3">
        <p className="line-clamp-2 text-size-2 leading-t3 font-bold tracking-2 text-gray-1000">
          {title}
        </p>
        {description && (
          <p className="line-clamp-1 text-size-1 leading-t2 font-medium tracking-0 text-gray-700">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

export default CurationCard;

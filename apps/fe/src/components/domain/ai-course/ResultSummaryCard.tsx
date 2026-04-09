import { cn } from "@/utils/cn";
import { Skeleton } from "@/components";

interface ResultSummaryCardProps {
  title: string;
  duration: string;
  price: string;
}

export default function ResultSummaryCard({ title, duration, price }: ResultSummaryCardProps) {
  const titleClass = cn("t7bold", "text-gray-1000");

  const metaLabelClass = cn(
    "flex items-center gap-x2",
    "text-size-3 leading-t4 font-medium tracking-1",
    "text-gray-700",
  );

  const metaValueClass = cn("text-size-3 leading-t4 font-medium tracking-1", "text-gray-900");

  return (
    <section className={cn("flex gap-x3", "px-x5 py-x6")}>
      <Skeleton shape="circle" className="h-[60px] w-[60px]" />

      <div className="flex flex-1 flex-col gap-x2">
        <h2 className={titleClass}>{title}</h2>

        <div className={metaLabelClass}>
          <span>소요시간</span>
          <span className={metaValueClass}>{duration}</span>
          <span>·</span>
          <span>예상비용</span>
          <span className={metaValueClass}>{price}</span>
        </div>
      </div>
    </section>
  );
}

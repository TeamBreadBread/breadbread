interface MyLevelCardProps {
  level: string;
  title: string;
  description: string;
  progressPercent: number;
}

export default function MyLevelCard({
  level,
  title,
  description,
  progressPercent,
}: MyLevelCardProps) {
  return (
    <section className="bg-white px-x5 pb-x6">
      <div className="overflow-hidden rounded-r3 border border-[#eeeff1] px-x4 py-[18px]">
        <div className="flex items-center gap-x2">
          <div className="h-x6 w-x6 rounded-r0_5 border border-[#eeeff1] bg-[#f7f8f9]" />

          <div className="flex items-center gap-x1">
            <span className="text-size-4 font-bold leading-t5 tracking-[-0.1px] text-[#217cf9]">
              {level}
            </span>
            <span className="text-size-4 font-bold leading-t5 tracking-[-0.1px] text-[#2a3038]">
              {title}
            </span>
          </div>

          <div className="ml-auto h-x6 w-x6 rounded-full bg-[#d9dbe0]" />
        </div>

        <div className="mt-[14px] flex flex-col gap-x2">
          <p className="text-size-1 font-regular leading-t2 tracking-0 text-[#868b94]">
            {description}
          </p>

          <div className="h-x3 overflow-hidden rounded-full bg-[#f3f4f5]">
            <div
              className="h-full rounded-full bg-[#868b94]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

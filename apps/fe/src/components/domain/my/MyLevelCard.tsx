import { AppIcon, IconAssets } from "@/components/icons";
import ImgBread from "@/assets/icons/Img_Bread.svg";

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
          <img src={ImgBread} alt="" aria-hidden className="h-x6 w-x6 shrink-0 object-contain" />

          <div className="flex items-center gap-[5px]">
            <span className="text-size-4 font-bold leading-t5 tracking-[-0.1px] text-orange-600">
              {level}
            </span>
            <span className="text-size-4 font-bold leading-t5 tracking-[-0.1px] text-[#2a3038]">
              {title}
            </span>
          </div>

          <AppIcon src={IconAssets.IcChevronRight} size="x6" color="gray-500" className="ml-auto" />
        </div>

        <div className="mt-[14px] flex flex-col gap-x2">
          <div className="flex flex-col gap-[5px]">
            {description.split("\n").map((line, index) => (
              <p key={index} className="font-pretendard typo-t2regular text-gray-700">
                {line}
              </p>
            ))}
          </div>

          <div className="h-x3 overflow-hidden rounded-full bg-[#f3f4f5]">
            <div
              className="h-full rounded-full bg-orange-600"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

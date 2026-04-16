export default function StatusBar() {
  return (
    <div className="bg-gray-00 pt-[21px]">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center justify-center pl-[16px] pr-[6px]">
          <div className="whitespace-nowrap text-center text-[17px] leading-[22px] text-gray-1000">
            9:41
          </div>
        </div>

        <div className="h-[10px] w-[124px] shrink-0" />

        <div className="flex flex-1 items-center justify-center gap-[7px] pl-[6px] pr-[16px]">
          <div className="h-[12px] w-[19px] rounded bg-gray-400" />
          <div className="h-[12px] w-[17px] rounded bg-gray-400" />
          <div className="h-[13px] w-[27px] rounded bg-gray-400" />
        </div>
      </div>
    </div>
  );
}

export default function StatusBar() {
  return (
    <div className="flex h-[50px] items-end justify-between px-4 pb-2 pt-[21px]">
      <div className="flex-1 text-center text-[17px] font-semibold leading-[22px] text-black">
        9:41
      </div>
      <div className="w-[124px]" />
      <div className="flex flex-1 items-center justify-center gap-[7px]">
        <div className="h-[12px] w-[19px] rounded bg-[#1a1c20]" />
        <div className="h-[12px] w-[17px] rounded bg-[#1a1c20]" />
        <div className="h-[13px] w-[27px] rounded bg-[#1a1c20]" />
      </div>
    </div>
  );
}

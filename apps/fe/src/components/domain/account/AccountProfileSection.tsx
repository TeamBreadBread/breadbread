export default function AccountProfileSection() {
  return (
    <section className="bg-white px-x5 py-x6">
      <div className="flex items-center justify-center">
        <div className="relative h-[100px] w-[100px]">
          <div className="h-full w-full rounded-full border border-[#eeeff1] bg-[#f7f8f9]" />
          <button
            type="button"
            aria-label="프로필 이미지 변경"
            className="absolute bottom-0 right-0 h-[28px] w-[28px] rounded-full border border-[#d1d3d8] bg-[#f3f4f5]"
          />
        </div>
      </div>
    </section>
  );
}

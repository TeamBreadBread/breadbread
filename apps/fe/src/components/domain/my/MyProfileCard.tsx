interface MyProfileCardProps {
  nickname: string;
  email: string;
  onClick?: () => void;
}

export default function MyProfileCard({ nickname, email, onClick }: MyProfileCardProps) {
  return (
    <section className="bg-white px-x5 py-x6">
      <div className="flex items-center gap-x4">
        <button
          type="button"
          onClick={onClick}
          className="flex w-full items-center gap-x4 text-left"
        >
          <div className="h-[64px] w-[64px] rounded-full border border-[#eeeff1] bg-[#f7f8f9]" />

          <div className="flex-1">
            <div className="text-size-5 font-bold leading-t6 tracking-[-0.1px] text-[#1a1c20]">
              {nickname}
            </div>
            <div className="mt-x1 text-size-3 font-regular leading-t4 tracking-[-0.1px] text-[#868b94]">
              {email}
            </div>
          </div>
        </button>
      </div>
    </section>
  );
}

interface SignupWelcomeSectionProps {
  name: string;
}

export default function SignupWelcomeSection({ name }: SignupWelcomeSectionProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-start px-0 pb-0 pt-[156px]">
      <div className="flex w-full flex-col items-center gap-[28px] p-[20px]">
        <div className="h-[100px] w-[100px] shrink-0 bg-gray-200" />

        <div className="flex w-full flex-col items-center gap-[8px]">
          <h1 className="w-full text-center text-[22px] font-bold leading-[30px] tracking-[0] text-gray-900">
            {name}님 환영합니다 🎉
          </h1>

          <p className="w-full text-center text-[16px] leading-[22px] tracking-[0] text-gray-600">
            로그인 후 빵빵의 모든 서비스를 이용해보세요.
          </p>
        </div>
      </div>
    </section>
  );
}

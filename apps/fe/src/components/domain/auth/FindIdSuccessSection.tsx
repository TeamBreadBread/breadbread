interface FindIdSuccessSectionProps {
  name: string;
  userId: string;
}

export default function FindIdSuccessSection({ name, userId }: FindIdSuccessSectionProps) {
  return (
    <section className="flex flex-1 flex-col items-center justify-start px-0 pb-0 pt-[156px]">
      <div className="flex w-full flex-col items-center gap-x7 p-x5">
        <div className="h-[100px] w-[100px] shrink-0 bg-gray-300" />

        <div className="flex w-full flex-col items-center gap-x2">
          <h1 className="w-full text-center text-size-7 font-bold leading-t8 tracking-0 text-gray-1000">
            {name}님의 아이디는
            <br />
            {userId} 입니다.
          </h1>

          <p className="w-full text-center text-size-4 leading-t5 tracking-0 text-gray-700">
            가입하신 아이디로 바로 로그인해보세요.
          </p>
        </div>
      </div>
    </section>
  );
}

import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import ArrowLeft from "@/assets/icons/ArrowLeft.svg";
import BottomNav from "@/components/layout/BottomNav";
import MobileFrame from "@/components/layout/MobileFrame";

const CircleIcon = ({ size = 28, color = "#dcdee3" }: { size?: number; color?: string }) => (
  <div className="rounded-full" style={{ width: size, height: size, backgroundColor: color }} />
);

const WriteHeader = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-1/2 z-40 flex h-[56px] w-full max-w-[402px] -translate-x-1/2 items-center justify-between border-b border-[#eeeff1] bg-white px-[20px] py-[10px] md:max-w-[744px]">
      <button
        type="button"
        className="flex h-[36px] w-[36px] shrink-0 items-center justify-center"
        onClick={() => navigate({ to: "/bbangteo-board" })}
      >
        <img src={ArrowLeft} alt="뒤로가기" className="h-[24px] w-[24px]" />
      </button>
      <button
        type="button"
        className="shrink-0 text-[18px] leading-[24px] font-medium text-[#b0b3ba]"
        disabled
      >
        게시
      </button>
    </header>
  );
};

const BbangteoBoardWritePage = () => {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  return (
    <MobileFrame className="bg-white">
      <div className="flex min-h-screen flex-1 flex-col bg-white">
        <WriteHeader />
        <main className="flex flex-1 flex-col gap-[10px] px-[20px] pb-[calc(56px+52px)] pt-[76px] sm:pb-[calc(60px+52px)]">
          <label className="sr-only" htmlFor="post-title">
            제목
          </label>
          <input
            id="post-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="제목을 입력하세요."
            className="w-full resize-none bg-transparent text-[18px] leading-[24px] font-bold text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none"
          />
          <label className="sr-only" htmlFor="post-body">
            내용
          </label>
          <textarea
            id="post-body"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder="내용을 입력하세요."
            rows={14}
            className="min-h-[200px] w-full resize-y bg-transparent text-[16px] leading-[22px] text-[#1a1c20] placeholder:text-[#b0b3ba] outline-none"
          />
        </main>
        <div className="fixed bottom-[56px] left-1/2 z-40 flex w-full max-w-[402px] -translate-x-1/2 flex-col bg-white pb-[env(safe-area-inset-bottom,0)] sm:bottom-[60px] md:max-w-[744px]">
          <div className="flex items-center justify-start border-t border-[#eeeff1] bg-white px-[14px] py-[8px]">
            <button
              type="button"
              aria-label="이미지 첨부"
              className="flex items-center justify-center"
            >
              <CircleIcon size={28} />
            </button>
          </div>
        </div>
      </div>
      <BottomNav />
    </MobileFrame>
  );
};

export default BbangteoBoardWritePage;

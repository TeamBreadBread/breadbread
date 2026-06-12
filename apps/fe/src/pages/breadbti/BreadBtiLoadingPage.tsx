import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

import { BREAD_BTI_RESULT_STORAGE_KEY } from "@/lib/breadbti/paths";

export default function BreadBtiLoadingPage() {
  const navigate = useNavigate();
  const mbti = sessionStorage.getItem(BREAD_BTI_RESULT_STORAGE_KEY);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void navigate({ to: "/breadbti/result" });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [mbti, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#FFF4E6] to-[#FFE8CC] px-6">
      <div className="relative mb-8 h-32 w-32">
        <div className="absolute inset-0 animate-pulse rounded-3xl bg-[#FF8C42]/20" />
        <div className="absolute inset-4 animate-pulse rounded-2xl bg-[#FF8C42]/30 delay-150" />
        <div className="absolute inset-8 animate-pulse rounded-xl bg-[#FF8C42]/40 delay-300" />
        <div className="absolute inset-0 flex animate-bounce items-center justify-center text-5xl">
          🥐
        </div>
      </div>

      <h2 className="mb-3 text-center text-2xl font-bold text-[#D86A00]">
        당신의 빵을 굽는 중... 🥐
      </h2>
      <p className="text-center text-base text-[#B87333]">오븐에서 결과를 만드는 중이에요</p>

      <div className="mt-8 flex gap-2">
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-[#FF8C42]"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-[#FF8C42]"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="h-2 w-2 animate-bounce rounded-full bg-[#FF8C42]"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

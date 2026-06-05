// “민진님, 오늘은 명란소금빵 어떠세요?”부터 추천 카드 + 빠른 메뉴 4개까지 전체
"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getStoredAccessToken } from "@/api/auth";
import { getMyProfile } from "@/api/user";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";
import leadingLogo from "@/assets/icons/Leading.svg";
import RecommendationHeroCard from "./RecommendationHeroCard";
import QuickMenuGrid from "./QuickMenuGrid";
import { pickRandomHomeGreetingBread } from "./homeGreetingBreads";
import { getDisplayNameForLoginId, getUserProfile, saveUserProfile } from "@/lib/userProfileCache";

const HomeHeroSection = () => {
  const navigate = useNavigate();
  const loggedIn = isLoggedIn();
  const [greetingBread] = useState(() => pickRandomHomeGreetingBread());
  const [displayName, setDisplayName] = useState(() => {
    const profile = getUserProfile();
    if (profile?.name?.trim()) return profile.name.trim();
    if (profile?.loginId?.trim()) return getDisplayNameForLoginId(profile.loginId);
    return "회원";
  });

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
      if (!getStoredAccessToken()) return;
      try {
        const me = await getMyProfile();
        if (!mounted) return;
        saveUserProfile({
          userId: me.userId != null ? Number(me.userId) : undefined,
          loginId: me.loginId?.trim() || "",
          name: me.name,
          email: me.email ?? "",
          phone: me.phone ?? "",
        });
        setDisplayName(me.name?.trim() || me.loginId?.trim() || "회원");
      } catch {
        // keep cached value
      }
    };
    void fetchProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const goAiCoursePreferenceFlow = () => {
    // 게스트도 취향/조건 입력 화면까지는 자유롭게 진입 (로그인은 마지막 "추천 받기" 단계에서 유도)
    void navigate({ to: AI_COURSE_FLOW_START });
  };

  return (
    <section className="bg-white px-5 pb-[18px] pt-[max(18px,env(safe-area-inset-top))]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-[18px]">
          <img src={leadingLogo} alt="빵빵" className="h-[41px] w-[63px] object-contain" />
          <h1 className="font-sans text-[20px] leading-[27px] tracking-[-0.02em] text-gray-1000">
            {loggedIn ? (
              <>
                <span className="font-bold">{displayName}</span>
                <span className="font-medium">님, 오늘은 </span>
              </>
            ) : (
              <span className="font-medium">오늘은 </span>
            )}
            <span className="font-bold">{greetingBread}</span>
            <span className="font-medium"> 어떠세요?</span>
          </h1>
        </div>

        <div className="flex gap-2">
          <RecommendationHeroCard onClick={goAiCoursePreferenceFlow} />
          <QuickMenuGrid />
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSection;

// “민진님, 오늘은 명란소금빵 어떠세요?”부터 추천 카드 + 빠른 메뉴 4개까지 전체
"use client";

import { useEffect, useState } from "react";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import leadingLogo from "@/assets/icons/Leading.svg";
import RecommendationHeroCard from "./RecommendationHeroCard";
import QuickMenuGrid from "./QuickMenuGrid";
import { pickRandomHomeGreetingBread } from "./homeGreetingBreads";
import {
  getDisplayNameForLoginId,
  getUserProfile,
  refreshProfileCacheFromServer,
} from "@/lib/userProfileCache";
import { useAiCourseEntry } from "@/hooks/useAiCourseEntry";

const HomeHeroSection = () => {
  const [greetingBread] = useState(() => pickRandomHomeGreetingBread());
  const { startAiCourseEntry, isNavigating, preferenceRequiredDialog } = useAiCourseEntry("/home");
  const [displayName, setDisplayName] = useState(() => {
    const profile = getUserProfile();
    if (profile?.name?.trim()) return profile.name.trim();
    if (profile?.loginId?.trim()) return getDisplayNameForLoginId(profile.loginId);
    return "회원";
  });

  useEffect(() => {
    if (!isLoggedIn()) return;

    let mounted = true;
    void refreshProfileCacheFromServer().then(() => {
      if (!mounted) return;
      const profile = getUserProfile();
      if (profile?.name?.trim()) {
        setDisplayName(profile.name.trim());
      } else if (profile?.loginId?.trim()) {
        setDisplayName(getDisplayNameForLoginId(profile.loginId));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const goAiCoursePreferenceFlow = () => {
    startAiCourseEntry();
  };

  return (
    <section className="bg-white px-5 pb-[18px] pt-[max(18px,env(safe-area-inset-top))]">
      {preferenceRequiredDialog}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-[18px]">
          <img src={leadingLogo} alt="빵빵" className="h-[41px] w-[63px] object-contain" />
          <h1 className="font-sans text-[20px] leading-[27px] tracking-[-0.02em] text-gray-1000">
            <span className="font-bold">{displayName}</span>
            <span className="font-medium">님, 오늘은 </span>
            <span className="font-bold">{greetingBread}</span>
            <span className="font-medium"> 어떠세요?</span>
          </h1>
        </div>

        <div className="flex gap-2">
          <div data-coach-target="ai-recommendation" className="flex min-w-0 flex-1">
            <RecommendationHeroCard onClick={goAiCoursePreferenceFlow} disabled={isNavigating} />
          </div>
          <div data-coach-target="quick-menu" className="flex min-w-0 flex-1">
            <QuickMenuGrid />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSection;

// “민진님, 오늘은 명란소금빵 어떠세요?”부터 추천 카드 + 빠른 메뉴 4개까지 전체
"use client";

import { useNavigate } from "@tanstack/react-router";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";
import RecommendationHeroCard from "./RecommendationHeroCard";
import QuickMenuGrid from "./QuickMenuGrid";
import { getDisplayNameForLoginId, getUserProfile } from "@/lib/userProfileCache";

const HomeHeroSection = () => {
  const navigate = useNavigate();
  const profile = getUserProfile();
  const displayName = profile?.loginId?.trim() ? getDisplayNameForLoginId(profile.loginId) : "민진";

  const goAiCoursePreferenceFlow = () => navigate({ to: AI_COURSE_FLOW_START });

  return (
    <section className="bg-white px-5 py-[18px]">
      <div className="flex flex-col gap-4">
        <h1 className="text-[20px] leading-[27px] tracking-[-0.02em] text-gray-1000">
          <span className="font-bold">{displayName}</span>
          <span className="font-medium">님, 오늘은 </span>
          <span className="font-bold">명란소금빵</span>
          <span className="font-medium"> 어떠세요? 🍞</span>
        </h1>

        <div className="flex gap-2">
          <RecommendationHeroCard onClick={goAiCoursePreferenceFlow} />
          <QuickMenuGrid />
        </div>
      </div>
    </section>
  );
};

export default HomeHeroSection;

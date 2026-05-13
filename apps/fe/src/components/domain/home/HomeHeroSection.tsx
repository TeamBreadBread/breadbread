// “민진님, 오늘은 명란소금빵 어떠세요?”부터 추천 카드 + 빠른 메뉴 4개까지 전체
"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { getMyProfile } from "@/api/user";
import { AI_COURSE_FLOW_START } from "@/utils/aiCourseFlow";
import RecommendationHeroCard from "./RecommendationHeroCard";
import QuickMenuGrid from "./QuickMenuGrid";
import { getDisplayNameForLoginId, getUserProfile, saveUserProfile } from "@/lib/userProfileCache";

const HomeHeroSection = () => {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(() => {
    const profile = getUserProfile();
    if (profile?.name?.trim()) return profile.name.trim();
    if (profile?.loginId?.trim()) return getDisplayNameForLoginId(profile.loginId);
    return "회원";
  });

  useEffect(() => {
    let mounted = true;
    const fetchProfile = async () => {
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

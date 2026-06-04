import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import BottomNav from "@/components/layout/BottomNav";
import AppShell from "@/components/layout/AppShell";
import HomeHeroSection from "@/components/domain/home/HomeHeroSection";
import CurationSection from "@/components/domain/home/CurationSection";
import DongCurationSection from "@/components/domain/home/DongCurationSection";
import { pickRandomDong, type DongOption } from "@/components/domain/home/dongCurationParams";
import { isLoggedIn } from "@/lib/auth/isLoggedIn";
import { useLoginRequired } from "@/lib/auth/useLoginRequired";

/** 세션당 1회만 홈 로그인 유도 말풍선 노출 */
const HOME_GUEST_PROMO_SHOWN_KEY = "bbang_home_guest_promo_shown";

const HomePage = () => {
  const { showInfoBubble } = useLoginRequired();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [firstCurationBakeryIds, setFirstCurationBakeryIds] = useState<number[]>([]);
  const [firstCurationReady, setFirstCurationReady] = useState(false);
  const [selectedDong, setSelectedDong] = useState<DongOption>(() => pickRandomDong());
  const prevPathRef = useRef(pathname);

  /** 다른 화면에서 홈으로 돌아올 때마다 동을 새로 랜덤 선택 */
  useEffect(() => {
    if (pathname !== "/home") {
      prevPathRef.current = pathname;
      return;
    }
    if (prevPathRef.current !== "/home") {
      queueMicrotask(() => setSelectedDong(pickRandomDong()));
    }
    prevPathRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    if (isLoggedIn()) return;
    if (sessionStorage.getItem(HOME_GUEST_PROMO_SHOWN_KEY)) return;
    sessionStorage.setItem(HOME_GUEST_PROMO_SHOWN_KEY, "1");
    const timer = window.setTimeout(() => {
      showInfoBubble("로그인을 하면 더 많은 기능을 사용하실 수 있어요!");
    }, 600);
    return () => window.clearTimeout(timer);
  }, [showInfoBubble]);

  return (
    <AppShell>
      <main className="flex-1 space-y-[10px] pb-[56px] sm:pb-[72px]">
        <HomeHeroSection />
        <CurationSection
          onDisplayedBakeryIdsChange={(ids) => {
            setFirstCurationBakeryIds(ids);
            setFirstCurationReady(true);
          }}
        />
        <DongCurationSection
          selectedDong={selectedDong}
          excludeBakeryIds={firstCurationBakeryIds}
          readyToPick={firstCurationReady}
        />
      </main>

      <BottomNav />
    </AppShell>
  );
};

export default HomePage;

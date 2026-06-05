import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import BottomNav from "@/components/layout/BottomNav";
import AppShell from "@/components/layout/AppShell";
import HomeHeroSection from "@/components/domain/home/HomeHeroSection";
import CurationSection from "@/components/domain/home/CurationSection";
import DongCurationSection from "@/components/domain/home/DongCurationSection";
import { pickRandomDong, type DongOption } from "@/components/domain/home/dongCurationParams";

const HomePage = () => {
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

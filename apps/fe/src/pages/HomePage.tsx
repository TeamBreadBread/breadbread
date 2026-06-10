import { useLayoutEffect, useRef, useState } from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import BottomNav from "@/components/layout/BottomNav";
import AppShell from "@/components/layout/AppShell";
import HomeHeroSection from "@/components/domain/home/HomeHeroSection";
import CurationSection from "@/components/domain/home/CurationSection";
import DongCurationSection from "@/components/domain/home/DongCurationSection";
import TrendCurationSection from "@/components/domain/trend/TrendCurationSection";
import { buildBbangteoBakeryListSearch } from "@/utils/bakeryListEntry";
import {
  beginHomeCurationVisit,
  resetHomeCurationVisitDedupe,
  type HomeCurationVisit,
} from "@/components/domain/home/dongCurationParams";

const HomePage = () => {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [firstCurationBakeryIds, setFirstCurationBakeryIds] = useState<number[]>([]);
  const [trendCurationBakeryIds, setTrendCurationBakeryIds] = useState<number[]>([]);
  const [firstCurationReady, setFirstCurationReady] = useState(false);
  const [homeVisit, setHomeVisit] = useState<HomeCurationVisit | null>(null);
  const prevPathRef = useRef(pathname);
  const homeVisitSetupRef = useRef(false);

  /** 홈 진입·재진입마다 동·큐레이션 픽을 한 번만 새로 섞습니다. */
  useLayoutEffect(() => {
    if (pathname !== "/home") {
      resetHomeCurationVisitDedupe();
      prevPathRef.current = pathname;
      homeVisitSetupRef.current = false;
      return;
    }
    if (homeVisitSetupRef.current) return;
    homeVisitSetupRef.current = true;

    const returningToHome = prevPathRef.current !== "/home";
    prevPathRef.current = pathname;

    const visit = beginHomeCurationVisit();
    void Promise.resolve().then(() => {
      setHomeVisit(visit);
      if (returningToHome) {
        setFirstCurationBakeryIds([]);
        setFirstCurationReady(false);
      }
    });
  }, [pathname]);

  const activeHomeVisit = pathname === "/home" ? homeVisit : null;

  return (
    <AppShell>
      <main className="flex-1 space-y-[10px] pb-[56px] sm:pb-[72px]">
        <HomeHeroSection />
        {activeHomeVisit ? (
          <>
            <TrendCurationSection
              title="요즘 뜨는 빵"
              bakeryListEntryFrom="home"
              onMoreClick={() => {
                void navigate({
                  to: "/bbangteo-bakery-list",
                  search: buildBbangteoBakeryListSearch({
                    from: "home",
                    curationPins: trendCurationBakeryIds,
                  }),
                });
              }}
              onDisplayedBakeryIdsChange={setTrendCurationBakeryIds}
            />
            <CurationSection
              key={activeHomeVisit.seed}
              onDisplayedBakeryIdsChange={(ids) => {
                setFirstCurationBakeryIds(ids);
                setFirstCurationReady(true);
              }}
            />
            <DongCurationSection
              key={`${activeHomeVisit.seed}-${activeHomeVisit.dong}`}
              selectedDong={activeHomeVisit.dong}
              excludeBakeryIds={firstCurationBakeryIds}
              readyToPick={firstCurationReady}
            />
          </>
        ) : null}
      </main>

      <BottomNav />
    </AppShell>
  );
};

export default HomePage;

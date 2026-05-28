import { useState } from "react";
import BottomNav from "@/components/layout/BottomNav";
import AppShell from "@/components/layout/AppShell";
import HomeHeroSection from "@/components/domain/home/HomeHeroSection";
import CurationSection from "@/components/domain/home/CurationSection";
import DongCurationSection from "@/components/domain/home/DongCurationSection";

const HomePage = () => {
  const [firstCurationBakeryIds, setFirstCurationBakeryIds] = useState<number[]>([]);

  return (
    <AppShell>
      <main className="flex-1 space-y-[10px] pb-[56px] sm:pb-[72px]">
        <HomeHeroSection />
        <CurationSection onDisplayedBakeryIdsChange={setFirstCurationBakeryIds} />
        <DongCurationSection excludeBakeryIds={firstCurationBakeryIds} />
      </main>

      <BottomNav />
    </AppShell>
  );
};

export default HomePage;

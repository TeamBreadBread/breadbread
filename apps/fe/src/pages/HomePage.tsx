import TopHeader from "@/components/layout/TopHeader";
import BottomNav from "@/components/layout/BottomNav";
import AppShell from "@/components/layout/AppShell";
import HomeHeroSection from "@/components/domain/home/HomeHeroSection";
import CurationSection from "@/components/domain/home/CurationSection";

const HomePage = () => {
  return (
    <AppShell>
      <TopHeader />

      <main className="flex-1 space-y-[10px] pb-[90px] md:pb-[72px]">
        <HomeHeroSection />
        <CurationSection />
      </main>

      <BottomNav />
    </AppShell>
  );
};

export default HomePage;

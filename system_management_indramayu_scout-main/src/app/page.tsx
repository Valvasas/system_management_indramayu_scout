import Hero from "@/components/Hero";
import StatsSection from "@/components/StatsSection";
import AboutPreview from "@/components/AboutPreview";
import AgendaPreview from "@/components/AgendaPreview";
import NewsPreview from "@/components/NewsPreview";
import GalleryPreview from "@/components/GalleryPreview";
import AchievementPreview from "@/components/AchievementPreview";
import MapSection from "@/components/MapSection";

export default function Home() {
  return (
    <>
      <Hero />
      <StatsSection />
      <AboutPreview />
      <AgendaPreview />
      <NewsPreview />
      <GalleryPreview />
      <AchievementPreview />
      <MapSection />
    </>
  );
}

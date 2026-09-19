import { Hero } from "@/components/public/Hero";
import { StatsSection } from "@/components/public/StatsSection";
import { AboutPreview } from "@/components/public/AboutPreview";
import { AgendaPreview } from "@/components/public/AgendaPreview";
import { NewsPreview } from "@/components/public/NewsPreview";
import { GalleryPreview } from "@/components/public/GalleryPreview";
import { AchievementPreview } from "@/components/public/AchievementPreview";
import { MapSection } from "@/components/public/MapSection";

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

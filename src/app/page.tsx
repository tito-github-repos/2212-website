import AppDownloadSection from "./components/home/appdownloadsection";
import CompetitionsSection from "./components/home/competitionssection";
import DailyPracticeSection from "./components/home/dailypracticesection";
import HeroSection from "./components/home/herosection";
import PremiumResourcesSection from "./components/home/Premiumresourcessection";
import RegisterSection from "./components/home/registerform";


export default function Home() {
  return (
    <>
      <HeroSection />
      <AppDownloadSection />
      <PremiumResourcesSection />
      <CompetitionsSection />
      <DailyPracticeSection />
      <RegisterSection />
      
    </>
  );
}
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { About } from "@/components/sections/About";
import { EcosystemHub } from "@/components/sections/EcosystemHub";
import { CompanyRoadmap } from "@/components/sections/CompanyRoadmap";
import { FounderPreview } from "@/components/sections/FounderPreview";
import { CompanyTrust } from "@/components/sections/CompanyTrust";
import { VisionMission } from "@/components/sections/VisionMission";
import { CoreValues } from "@/components/sections/CoreValues";
import { WhyXeltrio } from "@/components/sections/WhyXeltrio";
import { Technology } from "@/components/sections/Technology";
import { ProductPreview } from "@/components/sections/ProductPreview";
import { HamiaWorksAI } from "@/components/sections/HamiaWorksAI";
import { Roadmap } from "@/components/sections/Roadmap";
import { CmsSections } from "@/components/cms/CmsPage";

export default async function Home() {
  return (
    <>
      <Nav />
      <main id="main">
        <Hero />
        <About />
        <EcosystemHub />
        <CompanyRoadmap />
        <FounderPreview />
        <CompanyTrust />
        <VisionMission />
        <CoreValues />
        <WhyXeltrio />
        <Technology />
        <ProductPreview />
        <HamiaWorksAI />
        <Roadmap />
        <CmsSections slug="home" />
      </main>
      <Footer />
    </>
  );
}

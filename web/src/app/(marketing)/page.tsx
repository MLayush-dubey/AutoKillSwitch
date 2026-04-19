import { Hero } from "@/components/marketing/hero";
import { ProblemSection } from "@/components/marketing/problem-section";
import { HowItWorksSteps } from "@/components/marketing/how-it-works-steps";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { DashboardShowcase } from "@/components/marketing/dashboard-showcase";
import { PricingCards } from "@/components/marketing/pricing-cards";
import { LandingFaq } from "@/components/marketing/landing-faq";
import { FinalCta } from "@/components/marketing/final-cta";

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <HowItWorksSteps />
      <FeaturesGrid />
      <DashboardShowcase />
      <PricingCards />
      <LandingFaq />
      <FinalCta />
    </>
  );
}

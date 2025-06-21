// src/app/page.tsx - (Updated)

import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { ProductivityFlow } from "@/components/landing/ProductivityFlow"; // Import the new component
import { CtaSection } from "@/components/landing/CtaSection";
import { Footer } from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <FeaturesSection />
        <ProductivityFlow /> {/* Add the new component here */}
        <CtaSection />
      </main>
      <Footer />
    </>
  );
}
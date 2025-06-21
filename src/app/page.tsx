// D:\applications\tasks\TaskZenith\src\app\page.tsx
// -- INTEGRATING SMOOTH SCROLL --

import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Header } from "@/components/landing/Header";
import { TestimonialsSection } from "@/components/landing/TestimonialsSection";
import SmoothScroll from "@/components/landing/SmoothScroll"; // استيراد المكون الجديد

export default function LandingPageV2() {
  return (
    <SmoothScroll> {/* تغليف كل شيء هنا */}
      <div className="bg-black text-white overflow-x-hidden"> {/* إضافة overflow-x-hidden */}
        <Header />
        <main>
          <HeroSection />
          <FeaturesSection />
          <TestimonialsSection />
          {/* We will add more sections here later */}
        </main>
      </div>
    </SmoothScroll>
  );
}
import { SiteHeader } from "@/components/landing/site-header";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { DocsSection } from "@/components/landing/docs-section";
import { SupportSection } from "@/components/landing/support-section";
import { SiteFooter } from "@/components/landing/site-footer";

export default function LandingPage() {
  return (
    <div className="min-h-svh overflow-x-hidden text-ink">
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <DocsSection />
        <SupportSection />
      </main>
      <SiteFooter />
    </div>
  );
}

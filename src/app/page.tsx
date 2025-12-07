import { Header } from '@/components/landing/header';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { HowItWorks } from '@/components/landing/how-it-works';
import { LiveStats } from '@/components/landing/live-stats';
import { Testimonials } from '@/components/landing/testimonials';
import { Fees } from '@/components/landing/fees';
import { Faq } from '@/components/landing/faq';
import { Terms } from '@/components/landing/terms';
import { Footer } from '@/components/landing/footer';
import { ScrollProgress } from '@/components/landing/scroll-progress';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollProgress />
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <LiveStats />
        <Testimonials />
        <Fees />
        <div className="container mx-auto max-w-5xl px-4 py-16 sm:py-24">
          <Faq />
        </div>
        <div className="bg-secondary/30">
          <div className="container mx-auto max-w-5xl px-4 py-16 sm:py-24">
            <Terms />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

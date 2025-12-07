
"use client";

import { useLayoutEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, Target, Zap, ShieldCheck, Smartphone, Globe, Clock, CheckCircle2 } from 'lucide-react';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: <Zap className="h-8 w-8 text-accent" />,
    title: 'Fast',
    description: 'Post shifts and find qualified professionals in minutes, not days. Respond to urgent needs instantly.',
    highlights: ['Instant matching', '< 3h average fill time'],
  },
  {
    icon: <Target className="h-8 w-8 text-accent" />,
    title: 'Focused',
    description: 'A dedicated platform for healthcare staffing in Africa, built with local needs in mind.',
    highlights: ['East & Central Africa', 'Local currency support'],
  },
  {
    icon: <Rocket className="h-8 w-8 text-accent" />,
    title: 'Automated',
    description: 'From KYC and license verification to payouts and receipts, we automate the admin work.',
    highlights: ['Auto-verification', 'Smart payout scheduling'],
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-accent" />,
    title: 'Secure',
    description: 'All professionals are pre-verified, and payments are handled securely through trusted partners.',
    highlights: ['M-Pesa integration', 'License monitoring'],
  },
];

export function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Badge animation
      gsap.fromTo(".features-badge",
        { opacity: 0, y: 30, scale: 0.9 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none"
          }
        }
      );

      // Section title
      gsap.fromTo(".features-title",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 70%",
            toggleActions: "play none none none"
          }
        }
      );

      // Cards animation with stagger
      gsap.fromTo(".feature-card",
        {
          opacity: 0,
          y: 60,
          rotateY: -15,
          scale: 0.9
        },
        {
          opacity: 1,
          y: 0,
          rotateY: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: {
            trigger: cardsRef.current,
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );

      // Icon pulse animation
      gsap.to(".feature-icon", {
        scale: 1.1,
        duration: 0.6,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: {
          each: 0.2,
          repeat: -1
        }
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="relative w-full bg-gradient-to-b from-secondary/30 via-background to-background py-20 sm:py-32 overflow-hidden" ref={sectionRef}>
      {/* Decorative elements - full width */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute left-0 top-1/4 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-0 bottom-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
        backgroundSize: '40px 40px'
      }} />

      {/* Full-width container */}
      <div className="relative z-10 w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Header section */}
          <div className="mb-16 text-center">
            <div className="features-badge inline-flex items-center gap-2 rounded-full bg-accent/10 px-6 py-2.5 text-sm font-medium text-accent backdrop-blur-sm border border-accent/20 shadow-lg mb-8">
              <Smartphone className="h-4 w-4 animate-pulse" />
              <span>iOS & Android apps coming soon</span>
            </div>
            <h2 className="features-title font-headline text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4">
              Why clinics and professionals{' '}
              <span className="gradient-text">choose CareStint</span>
            </h2>
            <p className="features-title text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Built for the unique challenges of healthcare staffing in Africa, with all the automation you need.
            </p>
          </div>

          {/* Cards grid - full width */}
          <div ref={cardsRef} className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <Card
                key={feature.title}
                className="feature-card group relative border-none bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm hover:from-card/90 hover:to-card/60 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-4 hover:scale-105 overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/5 group-hover:to-primary/5 transition-all duration-500" />

                {/* Number badge */}
                <div className="absolute top-4 right-4 text-5xl font-bold font-headline text-muted-foreground/10 group-hover:text-accent/20 transition-colors duration-500">
                  0{index + 1}
                </div>

                <CardHeader className="items-center relative z-10 pb-2">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/20 to-primary/20 shadow-lg group-hover:shadow-accent/50 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6">
                    <div className="feature-icon">
                      {feature.icon}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="text-center relative z-10 space-y-4">
                  <h3 className="font-headline text-2xl font-bold group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">
                    {feature.description}
                  </p>

                  {/* Feature highlights */}
                  <div className="pt-2 space-y-2">
                    {feature.highlights.map((highlight, i) => (
                      <div key={i} className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="h-3 w-3 text-accent" />
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>

                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </Card>
            ))}
          </div>

          {/* Bottom stats bar */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 max-w-4xl mx-auto">
            {[
              { icon: <Globe className="h-5 w-5" />, label: '3 Countries', sublabel: 'Kenya, Uganda, Tanzania' },
              { icon: <Clock className="h-5 w-5" />, label: '24/7', sublabel: 'Platform availability' },
              { icon: <ShieldCheck className="h-5 w-5" />, label: '100%', sublabel: 'Verified pros' },
              { icon: <Zap className="h-5 w-5" />, label: '< 3 hrs', sublabel: 'Avg. fill time' },
            ].map((stat, i) => (
              <div key={i} className="feature-card flex flex-col items-center justify-center rounded-xl bg-secondary/50 backdrop-blur-sm p-4 text-center border border-border/50 hover:border-accent/30 transition-colors">
                <div className="text-accent mb-2">{stat.icon}</div>
                <div className="font-headline font-bold text-lg">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

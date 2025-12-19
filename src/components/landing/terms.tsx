
"use client";

import { useLayoutEffect, useRef } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Scale, FileText, AlertTriangle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

export function Terms() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".terms-header",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none"
          }
        }
      );
      gsap.fromTo(".terms-item",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".terms-accordion",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={sectionRef}>
      <div className="terms-header mb-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-2 text-sm font-medium text-muted-foreground mb-6">
          <Scale className="h-4 w-4" />
          Platform policies
        </div>
        <h2 className="font-headline text-3xl font-bold tracking-tight sm:text-4xl">
          Terms of Use
        </h2>
        <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
          Summary of platform policies and user responsibilities.
        </p>
      </div>
      <Accordion type="single" collapsible defaultValue="item-0" className="w-full terms-accordion space-y-3">
        <AccordionItem value="item-0" className="terms-item glass-card rounded-xl border-border/50 px-6 overflow-hidden">
          <AccordionTrigger className="text-left text-lg hover:no-underline hover:text-accent py-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <FileText className="h-4 w-4 text-blue-400" />
              </div>
              <span className="font-semibold">Employers/Facilities</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pl-12 pb-5">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">15% booking fee</p>
                  <p>Charged at confirmation. Urgent (&lt;24h) shifts incur 20%.</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">Rates</p>
                  <p>Post an offered rate for Half-day or Full-day. Allow bids if you want counter-offers.</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">Cancellation</p>
                  <p>Employer/Facility cancellation &lt;24h: KSh 1,000 or 20% (whichever is higher).</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">Permanent Hire</p>
                  <p>Looking for a permanent hire? Contact us.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-accent bg-accent/10 rounded-lg p-2">
                <AlertTriangle className="h-3 w-3" />
                <span>Disputes window: 24 hours after the shift.</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-1" className="terms-item glass-card rounded-xl border-border/50 px-6 overflow-hidden">
          <AccordionTrigger className="text-left text-lg hover:no-underline hover:text-accent py-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
                <FileText className="h-4 w-4 text-green-400" />
              </div>
              <span className="font-semibold">Professionals</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pl-12 pb-5">
            <div className="space-y-4 text-sm text-muted-foreground">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">5% platform fee</p>
                  <p>Shown before you accept. We pass through M-Pesa payout costs.</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">Apply/Bid</p>
                  <p>Apply at the posted rate or bid if allowed.</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">Payout</p>
                  <p>Your payout = offered rate − 5% (platform fee) − M-Pesa cost.</p>
                </div>
                <div className="rounded-lg bg-secondary/50 p-3 border border-border/50">
                  <p className="font-semibold text-foreground mb-1">Shifts</p>
                  <p>Half-day or Full-day. Overtime can be added if both sides agree.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-yellow-500 bg-yellow-500/10 rounded-lg p-2">
                <AlertTriangle className="h-3 w-3" />
                <span>Late cancel &lt;24h: strike + temporary de-ranking; no-show fees may apply.</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="terms-item glass-card rounded-xl border-border/50 px-6 overflow-hidden">
          <AccordionTrigger className="text-left text-lg hover:no-underline hover:text-accent py-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                <Scale className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-semibold">Platform Disclaimer</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pl-12 pb-5">
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>CareStint is a platform that connects healthcare professionals with Employers/Facilities. <strong className="text-foreground">CareStint is not the employer of record</strong> for either party. All hiring decisions and contracts are made directly between Employers/Facilities and professionals.</p>

              <p>By using the platform, Employers/Facilities agree that they are responsible for complying with <strong className="text-foreground">local labour, tax and professional regulations</strong>, including any onboarding and supervision required for temporary staff.</p>

              <p>Payments are processed on behalf of Employers/Facilities and released to professionals after shift completion, minus platform and payout fees. In a live deployment, detailed statements would be available for both sides before a stint is confirmed.</p>

              <p>CareStint is intended to support <strong className="text-foreground">short-term staffing only</strong> and does not guarantee availability of professionals or stints. Either side may cancel in line with the applicable cancellation policy once defined in the production system.</p>

              <p>Basic profile and booking information may be stored to operate the service and improve matching. In a real deployment, this would be governed by a full Privacy Policy and Data Protection addendum specific to the region.</p>


            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

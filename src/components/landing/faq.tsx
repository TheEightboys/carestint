
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
import { HelpCircle, Banknote, Shield, CreditCard, Calendar, MapPin, AlertCircle } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    icon: <Banknote className="h-5 w-5 text-accent" />,
    question: "How do the 15%, 20% and 5% fees work?",
    answer: `Employers/Facilities only pay a booking fee once a professional accepts a stint.

• **Normal notice (24h+):** 15% of the offered rate
• **Urgent shifts (<12–24h):** 20% of the offered rate

Professionals pay a **5% platform/service fee** on their payout.

All fees are shown upfront before a stint is confirmed.`,
  },
  {
    icon: <Shield className="h-5 w-5 text-accent" />,
    question: "Are professionals verified?",
    answer: `Yes. Every professional profile goes through **license and ID checks** before they can apply, bid or clock in.

The SuperAdmin validates professional documents, and the system **automatically monitors**:
• License expiry dates
• Suspicious activity patterns
• Dispute trends and resolutions`,
  },
  {
    icon: <CreditCard className="h-5 w-5 text-accent" />,
    question: "Do I have to pay a monthly subscription?",
    answer: `**No.** CareStint operates on a pay-as-you-book model.

Employers/Facilities only pay when a shift is successfully confirmed.

Subscription tiers may be added later for high-volume employers (e.g., discounted booking fees or extra features).`,
  },
  {
    icon: <Calendar className="h-5 w-5 text-accent" />,
    question: "When do professionals get paid?",
    answer: `Payouts are processed after the shift is marked as **completed** and the **24-hour dispute window** closes.

CareStint releases the professional's payout:
• Offered rate
• Minus 5% platform fee
• Minus M-Pesa cost

Funds are sent to their preferred payout method (M-Pesa or bank).`,
  },
  {
    icon: <AlertCircle className="h-5 w-5 text-accent" />,
    question: "What happens if an Employer/Facility cancels a stint?",
    answer: `If an Employer/Facility cancels **less than 12 hours** before the shift, a cancellation fee applies:

**KSh 1,000 or 20% of the offered rate** (whichever is higher).

These rules can be adjusted per market, but the app treats them as configurable policy.`,
  },
  {
    icon: <MapPin className="h-5 w-5 text-accent" />,
    question: "Where is CareStint available?",
    answer: `CareStint is being piloted in **East & Central Africa**, starting with selected regions in:

• 🇰🇪 Kenya
• 🇺🇬 Uganda
• 🇹🇿 Tanzania

New regions can be added gradually as we onboard more Employers/Facilities and professionals.`,
  },
];

export function Faq() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Header animation with blur
      gsap.fromTo(".faq-header",
        { opacity: 0, y: 50, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none"
          }
        }
      );

      // FAQ items with stagger
      gsap.fromTo(".faq-item",
        { opacity: 0, x: -30 },
        {
          opacity: 1,
          x: 0,
          duration: 0.8,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".faq-accordion",
            start: "top 85%",
            toggleActions: "play none none none"
          }
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // Simple markdown-style bold text renderer
  const renderAnswer = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Handle bold text
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={i} className={line.startsWith('•') ? 'pl-4' : ''}>
          {parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div ref={sectionRef}>
      <div className="faq-header mb-12 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
          <HelpCircle className="h-4 w-4" />
          Got questions?
        </div>
        <h2 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl mb-4">
          <span className="gradient-text">Frequently Asked</span> Questions
        </h2>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Quick answers to common questions about how CareStint works.
        </p>
      </div>
      <Accordion type="single" collapsible className="w-full faq-accordion space-y-4">
        {faqs.map((faq, index) => (
          <AccordionItem
            value={`item-${index}`}
            key={index}
            className="faq-item glass-card rounded-xl border-accent/10 px-6 transition-all duration-300 hover:border-accent/30 hover:bg-accent/5 overflow-hidden"
          >
            <AccordionTrigger className="text-left hover:no-underline hover:text-accent transition-colors py-5 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                  {faq.icon}
                </div>
                <span className="text-lg font-semibold">{faq.question}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="text-base text-muted-foreground leading-relaxed pb-6 pl-14 space-y-2">
              {renderAnswer(faq.answer)}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

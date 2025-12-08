
"use client";

import { useState, useLayoutEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { HowItWorksModalContent } from './how-it-works-modal';
import { AnimatedBackground } from './animated-background';
import { FloatingElements } from './floating-elements';
import { AuthModal } from '@/components/auth/auth-modal';
import type { UserType } from '@/components/auth/auth-modal';
import { useUser } from '@/lib/user-context';
import { Briefcase, TrendingUp, MapPin, Clock, Sparkles, Users, ArrowRight, Building, CheckCircle2, LayoutDashboard, Loader2 } from 'lucide-react';
import { gsap } from "gsap";

export function Hero() {
  const router = useRouter();
  const { user, userRole, isLoading } = useUser();

  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authUserType, setAuthUserType] = useState<UserType>('professional');
  const heroRef = useRef<HTMLDivElement>(null);

  const isLoggedIn = !!user && !!userRole;

  const handleAuthClick = (type: UserType) => {
    setAuthUserType(type);
    setAuthModalOpen(true);
  };

  const getDashboardUrl = () => {
    switch (userRole) {
      case 'superadmin':
        return '/dashboard/superadmin';
      case 'employer':
        return '/dashboard/employer';
      case 'professional':
        return '/dashboard/professional';
      default:
        return '/';
    }
  };

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Headline animations with natural timing
      gsap.fromTo(".hero-headline",
        { opacity: 0, y: 40, filter: "blur(10px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 1.2,
          ease: "power3.out",
          stagger: 0.15
        }
      );

      // Subline with slight delay
      gsap.fromTo(".hero-subline",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 1, ease: "power2.out", delay: 0.4 }
      );

      // Trust badges animation
      gsap.fromTo(".trust-badge",
        { opacity: 0, scale: 0.8, y: 20 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.8,
          ease: "back.out(1.5)",
          stagger: 0.1,
          delay: 0.6
        }
      );

      // Cards with depth animation
      gsap.fromTo(".hero-card",
        { opacity: 0, scale: 0.9, y: 30, rotateX: 10 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          ease: "back.out(1.2)",
          stagger: 0.15,
          delay: 0.8
        }
      );

      // Floating animation for cards
      gsap.to(".hero-card", {
        y: -8,
        duration: 3,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        stagger: {
          each: 0.5,
          repeat: -1
        }
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section className="relative w-full py-20 md:py-32 lg:py-40 overflow-hidden" ref={heroRef}>
        {/* Animated background elements */}
        <AnimatedBackground />
        <FloatingElements />

        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/20 to-background pointer-events-none" />

        <div className="container relative z-10 mx-auto px-4">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col justify-center space-y-8">
              <div className="space-y-4">
                <h1 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                  <span className="hero-headline inline-block">Find or fill your next</span>{' '}
                  <span className="hero-headline block gradient-text">healthcare stint.</span>
                  <span className="hero-headline block text-accent">Anytime, anywhere.</span>
                </h1>
                <p className="hero-subline max-w-[600px] text-lg text-muted-foreground md:text-xl leading-relaxed">
                  The leading platform connecting Employers/Facilities and healthcare professionals for flexible staffing across <span className="text-foreground font-medium">East & Central Africa</span>.
                </p>
              </div>

              {/* Hero CTAs - Auth Aware */}
              <div className="hero-subline flex flex-wrap gap-4">
                {isLoading ? (
                  <Button size="lg" disabled className="px-8 py-6">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Loading...
                  </Button>
                ) : isLoggedIn ? (
                  // Logged in - show Go to Dashboard
                  <>
                    <Button
                      size="lg"
                      onClick={() => router.push(getDashboardUrl())}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/30 text-lg px-8 py-6"
                    >
                      <LayoutDashboard className="mr-2 h-5 w-5" />
                      Go to Dashboard
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => setHowItWorksOpen(true)}
                      className="transition-all duration-300 hover:scale-105 hover:border-accent text-lg px-8 py-6"
                    >
                      <Sparkles className="mr-2 h-5 w-5" />
                      How it works
                    </Button>
                  </>
                ) : (
                  // Not logged in - show Create Account / Sign In
                  <>
                    <Button
                      size="lg"
                      onClick={() => handleAuthClick('professional')}
                      className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/30 text-lg px-8 py-6"
                    >
                      Create Account
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={() => handleAuthClick('employer')}
                      className="transition-all duration-300 hover:scale-105 hover:border-accent text-lg px-8 py-6"
                    >
                      <Building className="mr-2 h-5 w-5" />
                      Sign In
                    </Button>
                  </>
                )}
              </div>

              {/* Trust badges - tightened layout with checkmarks */}
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="trust-badge flex items-center gap-1.5 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">700+ Verified Professionals</span>
                </div>
                <div className="trust-badge flex items-center gap-1.5 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Pay-as-you-book</span>
                </div>
                <div className="trust-badge flex items-center gap-1.5 text-accent">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">Trusted by 300+ clinics</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap gap-8 pt-4">
                <div className="hero-subline">
                  <div className="text-3xl font-bold font-headline gradient-text">700+</div>
                  <div className="text-sm text-muted-foreground">Verified Professionals</div>
                </div>
                <div className="hero-subline">
                  <div className="text-3xl font-bold font-headline gradient-text">100+</div>
                  <div className="text-sm text-muted-foreground">Partner Facilities</div>
                </div>
                <div className="hero-subline">
                  <div className="text-3xl font-bold font-headline gradient-text">4,500+</div>
                  <div className="text-sm text-muted-foreground">Stints Completed</div>
                </div>
              </div>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">

                {/* Employer Card with glassmorphism */}
                <Card className="hero-card glass-card transform-gpu transition-all duration-500 hover:-translate-y-3 hover:scale-105 glow-accent-hover border-accent/20 group">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-xl">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                          <Briefcase className="h-4 w-4 text-accent" />
                        </span>
                        Today's stints
                      </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">For Employers</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between rounded-lg bg-accent/5 p-3 transition-colors hover:bg-accent/10">
                        <div>
                          <span className="text-sm font-medium">RN, Half-day</span>
                          <p className="text-xs text-muted-foreground">Nairobi • KSh 4,500</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 px-2 py-0.5 text-xs font-medium text-accent animate-pulse-glow">
                          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                          Open
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg bg-yellow-500/5 p-3 transition-colors hover:bg-yellow-500/10">
                        <div>
                          <span className="text-sm font-medium">Lab Tech, Full-day</span>
                          <p className="text-xs text-muted-foreground">Mombasa • KSh 6,000</p>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-400/20 px-2 py-0.5 text-xs font-medium text-yellow-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
                          Pending
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:scale-105 group-hover:border-accent"
                      onClick={() => setHowItWorksOpen(true)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      How it works
                    </Button>
                  </CardContent>
                </Card>

                {/* Professional Card with glassmorphism */}
                <Card className="hero-card glass-card transform-gpu transition-all duration-500 hover:-translate-y-3 hover:scale-105 glow-accent-hover border-accent/20 group">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-xl">
                      <span className="flex items-center gap-2">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-accent/20">
                          <TrendingUp className="h-4 w-4 text-accent" />
                        </span>
                        Suggested stint
                      </span>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">For Professionals</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg border border-accent/20 bg-gradient-to-br from-accent/5 to-transparent p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-lg">Clinical Officer</p>
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent mt-1">
                            Full-day
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg gradient-text">KSh 5,500</p>
                          <p className="text-xs text-muted-foreground">+ 5% fee</p>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1.5">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span>Aga Khan Hospital, Nairobi</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>8:00 AM - 5:00 PM</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>3 applicants</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full transition-all duration-300 hover:bg-accent hover:text-accent-foreground hover:scale-105 group-hover:border-accent"
                      onClick={() => setHowItWorksOpen(true)}
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      How it works
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-headline text-3xl">How CareStint Works</DialogTitle>
          </DialogHeader>
          <HowItWorksModalContent />
        </DialogContent>
      </Dialog>

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        userType={authUserType}
      />
    </>
  );
}

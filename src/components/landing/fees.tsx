"use client";

import { useLayoutEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Building, UserCheck, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

gsap.registerPlugin(ScrollTrigger);

export function Fees() {
    const sectionRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(".fees-header",
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

            gsap.fromTo(".fee-column",
                { opacity: 0, y: 60, scale: 0.95 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 1,
                    ease: "back.out(1.2)",
                    stagger: 0.2,
                    scrollTrigger: {
                        trigger: ".fee-columns",
                        start: "top 80%",
                        toggleActions: "play none none none"
                    }
                }
            );
        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="relative w-full py-20 sm:py-32 overflow-hidden" ref={sectionRef}>
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/20 to-background" />
            <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full bg-accent/10 blur-3xl opacity-50" />
            <div className="absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl opacity-50" />

            <div className="container relative z-10 mx-auto max-w-6xl px-4">
                <div className="fees-header mb-16 text-center">
                    <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2 text-sm font-medium text-accent mb-6">
                        <CheckCircle2 className="h-4 w-4" />
                        No hidden costs
                    </div>
                    <h2 className="font-headline text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                        <span className="gradient-text">Transparent Pricing,</span> Pay-as-you-book
                    </h2>
                    <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        No subscriptions. No hidden costs. Just simple, upfront pricing that scales with your needs.
                    </p>
                </div>

                {/* Two Column Fee Structure */}
                <div className="fee-columns grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                    {/* For Employers Column */}
                    <Card className="fee-column glass-card border-primary/20 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                                    <Building className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-2xl">For Employers</CardTitle>
                                    <CardDescription>Booking fees charged on confirmation</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                    <div className="text-3xl">📅</div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <h4 className="font-semibold">Normal Notice</h4>
                                            <span className="text-2xl font-bold gradient-text">15%</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">For shifts booked with 24h+ notice</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                                    <div className="text-3xl">⚡</div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <h4 className="font-semibold">Urgent Notice</h4>
                                            <span className="text-2xl font-bold text-yellow-500">20%</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">For shifts with less than 24h notice</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                    <div className="text-3xl">🚫</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">Cancellation</h4>
                                        <p className="text-sm text-muted-foreground">
                                            &lt;24h notice: KSh 1,000 or 20% (whichever is higher)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                    <div className="text-3xl">🤝</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">Permanent Hire</h4>
                                        <p className="text-sm text-muted-foreground">Looking for a permanent hire? Contact us.</p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA for employers */}
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Calculate exact costs in your dashboard after signing up.
                                </p>
                                <Button asChild className="w-full">
                                    <Link href="/auth?type=employer">
                                        Get Started as Employer
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* For Professionals Column */}
                    <Card className="fee-column glass-card border-accent/20 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent pb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20">
                                    <UserCheck className="h-6 w-6 text-accent" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-2xl">For Professionals</CardTitle>
                                    <CardDescription>Fees deducted from your payout</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                    <div className="text-3xl">💼</div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <h4 className="font-semibold">Platform Fee</h4>
                                            <span className="text-2xl font-bold gradient-text">5%</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Deducted from your final payout amount</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <div className="flex h-10 w-10 items-center justify-center">
                                        <Clock className="h-6 w-6 text-green-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-green-500">Payout Timeline</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Receive payment within 24 hours after shift completion (no disputes)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                    <div className="text-3xl">💳</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">Mobile/Bank Transfer Fee</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Standard M-Pesa, Airtel Money, or bank transfer fees apply
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-accent/5 border border-accent/20">
                                    <div className="text-3xl">✨</div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold">No Subscription</h4>
                                        <p className="text-sm text-muted-foreground">
                                            Free to join and browse stints. You only pay when you earn.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* CTA for professionals */}
                            <div className="pt-4 border-t">
                                <p className="text-sm text-muted-foreground mb-3">
                                    Use our earnings calculator in your dashboard after signing up.
                                </p>
                                <Button asChild variant="outline" className="w-full border-accent text-accent hover:bg-accent/10">
                                    <Link href="/auth?type=professional">
                                        Join as Professional
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Bottom note */}
                <div className="text-center text-sm text-muted-foreground max-w-xl mx-auto">
                    <p>
                        Detailed fee calculators are available in your dashboard after you create an account.
                        Employers see their costs, professionals see their earnings — with full transparency.
                    </p>
                </div>
            </div>
        </section>
    )
}

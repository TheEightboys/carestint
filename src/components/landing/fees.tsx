
"use client";

import { useLayoutEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Calculator, ArrowRight, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { getFeeBreakdown, formatCurrency } from '@/lib/fee-calculator';

gsap.registerPlugin(ScrollTrigger);

const feeTiers = [
    {
        title: "Normal Notice",
        rate: "15%",
        description: "For shifts booked with 24h+ notice. Charged to the clinic on confirmation.",
        audience: "Booking Fee",
        highlight: false,
        icon: "📅",
    },
    {
        title: "Urgent Notice",
        rate: "20%",
        description: "For urgent shifts booked with less than 24h notice.",
        audience: "Booking Fee",
        highlight: true,
        icon: "⚡",
    },
    {
        title: "Professional Service Fee",
        rate: "5%",
        description: "Platform fee deducted from the professional's final payout.",
        audience: "Service Fee",
        highlight: false,
        icon: "💼",
    },
];

export function Fees() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [offeredRate, setOfferedRate] = useState(5000);
    const [isUrgent, setIsUrgent] = useState(false);

    const breakdown = getFeeBreakdown(offeredRate, isUrgent ? 'urgent' : 'normal');

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Header animation
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

            // Cards with 3D effect
            gsap.fromTo(".fee-card",
                { opacity: 0, y: 60, rotateX: 10, scale: 0.9 },
                {
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                    scale: 1,
                    duration: 1,
                    ease: "back.out(1.2)",
                    stagger: 0.15,
                    scrollTrigger: {
                        trigger: ".fee-card-container",
                        start: "top 80%",
                        toggleActions: "play none none none"
                    }
                }
            );

            // Calculator animation
            gsap.fromTo(".fee-calculator",
                { opacity: 0, x: -50 },
                {
                    opacity: 1,
                    x: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: ".fee-calculator",
                        start: "top 85%",
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

                {/* Fee cards */}
                <div className="fee-card-container grid grid-cols-1 gap-6 md:grid-cols-3 mb-16">
                    {feeTiers.map((tier, index) => (
                        <Card
                            key={tier.title}
                            className={`fee-card group relative flex flex-col glass-card border-accent/20 hover:border-accent/40 transition-all duration-500 hover:-translate-y-2 hover:scale-105 overflow-hidden ${tier.highlight ? 'ring-2 ring-accent/50 md:scale-105' : ''
                                }`}
                        >
                            {/* Glow effect on hover */}
                            <div className="absolute inset-0 bg-gradient-to-br from-accent/0 to-accent/0 group-hover:from-accent/10 group-hover:to-primary/10 transition-all duration-500" />

                            {tier.highlight && (
                                <div className="absolute top-0 left-0 right-0 bg-accent/90 text-accent-foreground text-center py-1 text-xs font-semibold">
                                    Most Common
                                </div>
                            )}

                            <CardHeader className={`relative z-10 ${tier.highlight ? 'pt-8' : ''}`}>
                                <div className="text-3xl mb-2">{tier.icon}</div>
                                <p className="text-sm font-semibold text-accent uppercase tracking-wider">{tier.audience}</p>
                                <CardTitle className="font-headline text-2xl mt-2">{tier.title}</CardTitle>
                            </CardHeader>

                            <CardContent className="relative z-10 flex flex-1 flex-col justify-between">
                                <div>
                                    <div className="mb-6">
                                        <span className="text-6xl font-bold font-headline gradient-text block">{tier.rate}</span>
                                        <span className="text-sm text-muted-foreground">of offered rate</span>
                                    </div>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {tier.description}
                                    </p>
                                </div>
                            </CardContent>

                            {/* Shimmer effect */}
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Interactive fee calculator */}
                <div className="fee-calculator max-w-2xl mx-auto">
                    <Card className="glass-card border-accent/20 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                                    <Calculator className="h-5 w-5 text-accent" />
                                </div>
                                <div>
                                    <CardTitle className="font-headline text-xl">Fee Calculator</CardTitle>
                                    <CardDescription>See exactly what you'll pay or earn</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            {/* Input controls */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="rate" className="text-sm font-medium">Offered Rate (KSh)</Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        value={offeredRate}
                                        onChange={(e) => setOfferedRate(Number(e.target.value) || 0)}
                                        className="text-lg font-semibold"
                                        min={0}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium">Urgency</Label>
                                    <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                                        <Switch
                                            checked={isUrgent}
                                            onCheckedChange={setIsUrgent}
                                        />
                                        <span className={`text-sm font-medium ${isUrgent ? 'text-yellow-500' : 'text-foreground'}`}>
                                            {isUrgent ? '⚡ Urgent (<24h)' : '📅 Normal (24h+)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                                {/* Clinic side */}
                                <div className="space-y-3 rounded-lg bg-secondary/50 p-4">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                                        Clinic Pays
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Offered Rate</span>
                                            <span>{formatCurrency(breakdown.clinicOfferedRate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Booking Fee ({breakdown.clinicBookingFee.percent}%)</span>
                                            <span className="text-accent">+ {formatCurrency(breakdown.clinicBookingFee.amount)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                            <span>Total</span>
                                            <span className="gradient-text">{formatCurrency(breakdown.clinicTotalCost)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Professional side */}
                                <div className="space-y-3 rounded-lg bg-secondary/50 p-4">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-green-400"></span>
                                        Professional Receives
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Offered Rate</span>
                                            <span>{formatCurrency(breakdown.proGrossAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Platform Fee (5%)</span>
                                            <span className="text-red-400">- {formatCurrency(breakdown.proPlatformFee.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">M-Pesa Cost</span>
                                            <span className="text-red-400">- {formatCurrency(breakdown.proMpesaCost)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                            <span>Net Payout</span>
                                            <span className="text-green-400">{formatCurrency(breakdown.proNetPayout)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Platform revenue note */}
                            <div className="flex items-start gap-2 rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground">
                                <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                                <span>
                                    Platform revenue from this stint: <span className="font-semibold text-accent">{formatCurrency(breakdown.platformRevenue)}</span> (booking fee + platform fee)
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

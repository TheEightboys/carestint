"use client";

import { useLayoutEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CheckCircle2, Calculator, Info, Building, UserCheck, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getFeeBreakdown, formatCurrency } from '@/lib/fee-calculator';

gsap.registerPlugin(ScrollTrigger);

export function Fees() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const [offeredRate, setOfferedRate] = useState(5000);
    const [isUrgent, setIsUrgent] = useState(false);
    const [currency, setCurrency] = useState<'KSh' | 'UGX' | 'TZS'>('KSh');

    const breakdown = getFeeBreakdown(offeredRate, isUrgent ? 'urgent' : 'normal');

    // Currency conversion rates (approximate)
    const currencyRates: Record<string, number> = {
        'KSh': 1,
        'UGX': 28.5,  // 1 KSh ≈ 28.5 UGX
        'TZS': 18.5   // 1 KSh ≈ 18.5 TZS
    };

    const formatWithCurrency = (amount: number) => {
        const converted = Math.round(amount * currencyRates[currency]);
        return `${currency} ${converted.toLocaleString()}`;
    };

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

                {/* Two Column Fee Structure */}
                <div className="fee-columns grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
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
                                            &lt;12h notice: KSh 1,000 or 20% (whichever is higher)
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/50 border border-border/50">
                                    <div className="text-3xl">🤝</div>
                                    <div className="flex-1">
                                        <div className="flex items-baseline justify-between">
                                            <h4 className="font-semibold">Permanent Hire</h4>
                                            <span className="text-2xl font-bold gradient-text">35%</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground">Of first month's salary (success fee)</p>
                                    </div>
                                </div>
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
                                            Receive payment within 24 hours after the dispute window closes
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
                        </CardContent>
                    </Card>
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
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                                    <Select value={currency} onValueChange={(v) => setCurrency(v as 'KSh' | 'UGX' | 'TZS')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="KSh">🇰🇪 KSh (Kenya)</SelectItem>
                                            <SelectItem value="UGX">🇺🇬 UGX (Uganda)</SelectItem>
                                            <SelectItem value="TZS">🇹🇿 TZS (Tanzania)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rate" className="text-sm font-medium">Offered Rate ({currency})</Label>
                                    <Input
                                        id="rate"
                                        type="number"
                                        value={Math.round(offeredRate * currencyRates[currency])}
                                        onChange={(e) => setOfferedRate(Math.round((Number(e.target.value) || 0) / currencyRates[currency]))}
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
                                            {isUrgent ? '⚡ Urgent' : '📅 Normal'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t">
                                {/* Employer side */}
                                <div className="space-y-3 rounded-lg bg-secondary/50 p-4">
                                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-blue-400"></span>
                                        Employer Pays
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Offered Rate</span>
                                            <span>{formatWithCurrency(breakdown.clinicOfferedRate)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Booking Fee ({breakdown.clinicBookingFee.percent}%)</span>
                                            <span className="text-accent">+ {formatWithCurrency(breakdown.clinicBookingFee.amount)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                            <span>Total</span>
                                            <span className="gradient-text">{formatWithCurrency(breakdown.clinicTotalCost)}</span>
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
                                            <span>{formatWithCurrency(breakdown.proGrossAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Platform Fee (5%)</span>
                                            <span className="text-red-400">- {formatWithCurrency(breakdown.proPlatformFee.amount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Mobile/Bank Transfer Fee</span>
                                            <span className="text-red-400">- {formatWithCurrency(breakdown.proMpesaCost)}</span>
                                        </div>
                                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                                            <span>Net Payout</span>
                                            <span className="text-green-400">{formatWithCurrency(breakdown.proNetPayout)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Platform revenue note */}
                            <div className="flex items-start gap-2 rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground">
                                <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                                <span>
                                    Platform revenue from this stint: <span className="font-semibold text-accent">{formatWithCurrency(breakdown.platformRevenue)}</span> (booking fee + platform fee)
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>
    )
}

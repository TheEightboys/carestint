"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Wallet, Info } from 'lucide-react';
import { calculatePayout, estimateMpesaCost } from '@/lib/fee-calculator';

interface ProfessionalFeeCalculatorProps {
    className?: string;
}

export function ProfessionalFeeCalculator({ className }: ProfessionalFeeCalculatorProps) {
    const [offeredRate, setOfferedRate] = useState(5000);
    const [currency, setCurrency] = useState<'KSh' | 'UGX' | 'TZS'>('KSh');

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

    // Calculate the payout with estimated mpesa cost
    const mpesaCost = estimateMpesaCost(offeredRate);
    const payout = calculatePayout(offeredRate, mpesaCost);

    return (
        <Card className={`glass-card border-accent/20 overflow-hidden ${className || ''}`}>
            <CardHeader className="bg-gradient-to-r from-accent/10 to-transparent pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/20">
                        <Calculator className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-lg">Earnings Calculator</CardTitle>
                        <CardDescription>See exactly what you'll take home</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Input controls */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="currency" className="text-sm font-medium">Currency</Label>
                        <Select value={currency} onValueChange={(v) => setCurrency(v as 'KSh' | 'UGX' | 'TZS')}>
                            <SelectTrigger id="currency">
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
                </div>

                {/* Payout Breakdown */}
                <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-accent"></span>
                        Your Earnings Breakdown
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Offered Rate</span>
                            <span>{formatWithCurrency(payout.grossAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Platform Fee ({payout.platformFeePercent}%)</span>
                            <span className="text-red-400">- {formatWithCurrency(payout.platformFeeAmount)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Mobile/Bank Transfer Fee</span>
                            <span className="text-red-400">- {formatWithCurrency(payout.mpesaCost)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t">
                            <span>Your Take-Home</span>
                            <span className="text-green-500">{formatWithCurrency(payout.netAmount)}</span>
                        </div>
                    </div>
                </div>

                {/* Payout timeline info */}
                <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3 space-y-1">
                    <h4 className="font-semibold text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        Payout Timeline
                    </h4>
                    <p className="text-xs text-muted-foreground">
                        Payment is released 24 hours after shift completion, provided there are no disputes.
                    </p>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 rounded-lg bg-accent/5 p-3 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                    <span>
                        Platform fee is 5% of the offered rate. Transfer fees vary based on your payout method and amount.
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

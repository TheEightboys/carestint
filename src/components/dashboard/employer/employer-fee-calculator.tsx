"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, Building, Info } from 'lucide-react';
import { calculateBookingFee, formatCurrency } from '@/lib/fee-calculator';

interface EmployerFeeCalculatorProps {
    className?: string;
}

export function EmployerFeeCalculator({ className }: EmployerFeeCalculatorProps) {
    const [offeredRate, setOfferedRate] = useState(5000);
    const [isUrgent, setIsUrgent] = useState(false);
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

    const bookingFee = calculateBookingFee(offeredRate, isUrgent ? 'urgent' : 'normal');
    const totalCost = offeredRate + bookingFee.amount;

    return (
        <Card className={`glass-card border-primary/20 overflow-hidden ${className || ''}`}>
            <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent pb-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                        <Calculator className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-lg">Cost Calculator</CardTitle>
                        <CardDescription>See exactly what you'll pay</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Input controls */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                {/* Cost Breakdown */}
                <div className="rounded-lg bg-secondary/50 p-4 space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-primary"></span>
                        Your Cost Breakdown
                    </h4>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Offered Rate to Professional</span>
                            <span className="font-medium">{formatWithCurrency(offeredRate)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">
                                Booking Fee ({bookingFee.percent}%)
                                <span className="ml-1 text-xs">
                                    {isUrgent ? '(urgent)' : '(standard)'}
                                </span>
                            </span>
                            <span className="text-yellow-500 font-semibold text-base">+ {formatWithCurrency(bookingFee.amount)}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-xl pt-3 mt-2 border-t-2 border-primary/30 bg-primary/10 -mx-4 px-4 py-3 rounded-b-lg">
                            <span className="text-foreground">Total Cost</span>
                            <span className="text-teal-400 text-2xl">{formatWithCurrency(totalCost)}</span>
                        </div>
                    </div>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>
                        Booking fee is {isUrgent ? '20%' : '15%'} of the offered rate. Urgent bookings (less than 24 hours notice) incur a higher fee.
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}

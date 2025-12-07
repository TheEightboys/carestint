"use client";

import { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Sun, Moon, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface DayAvailability {
    available: boolean;
    halfDay: boolean;
    fullDay: boolean;
}

interface WeeklyAvailability {
    monday: DayAvailability;
    tuesday: DayAvailability;
    wednesday: DayAvailability;
    thursday: DayAvailability;
    friday: DayAvailability;
    saturday: DayAvailability;
    sunday: DayAvailability;
}

const defaultAvailability: WeeklyAvailability = {
    monday: { available: true, halfDay: true, fullDay: true },
    tuesday: { available: true, halfDay: true, fullDay: true },
    wednesday: { available: true, halfDay: true, fullDay: true },
    thursday: { available: true, halfDay: true, fullDay: true },
    friday: { available: true, halfDay: true, fullDay: true },
    saturday: { available: false, halfDay: false, fullDay: false },
    sunday: { available: false, halfDay: false, fullDay: false },
};

const dayLabels = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday',
};

interface BlockedDate {
    date: Date;
    reason?: string;
}

interface AvailabilityCalendarProps {
    professionalId: string;
}

export function AvailabilityCalendar({ professionalId }: AvailabilityCalendarProps) {
    const { toast } = useToast();
    const [availability, setAvailability] = useState<WeeklyAvailability>(defaultAvailability);
    const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isSaving, setIsSaving] = useState(false);

    const toggleDay = (day: keyof WeeklyAvailability, field: 'available') => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                available: !prev[day].available,
                halfDay: !prev[day].available,
                fullDay: !prev[day].available
            }
        }));
    };

    const toggleShift = (day: keyof WeeklyAvailability, shift: 'halfDay' | 'fullDay') => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                [shift]: !prev[day][shift]
            }
        }));
    };

    const toggleBlockedDate = (date: Date) => {
        const dateStr = date.toDateString();
        const exists = blockedDates.find(bd => bd.date.toDateString() === dateStr);

        if (exists) {
            setBlockedDates(prev => prev.filter(bd => bd.date.toDateString() !== dateStr));
        } else {
            setBlockedDates(prev => [...prev, { date, reason: 'Personal' }]);
        }
    };

    const isDateBlocked = (date: Date) => {
        return blockedDates.some(bd => bd.date.toDateString() === date.toDateString());
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDayOfMonth = new Date(year, month, 1).getDay();

        const days: (Date | null)[] = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < (firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    };

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const saveAvailability = async () => {
        setIsSaving(true);
        try {
            // In production, this would call the API
            await new Promise(resolve => setTimeout(resolve, 1000));
            toast({
                title: 'Availability Saved',
                description: 'Your availability has been updated successfully.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to save availability. Please try again.',
            });
        } finally {
            setIsSaving(false);
        }
    };

    const days = getDaysInMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            {/* Weekly Availability */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Weekly Availability
                    </CardTitle>
                    <CardDescription>
                        Set your regular weekly availability for stints.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {(Object.keys(dayLabels) as Array<keyof typeof dayLabels>).map((day) => (
                            <div
                                key={day}
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border transition-colors",
                                    availability[day].available ? "bg-green-500/5 border-green-500/20" : "bg-secondary/50"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Switch
                                        checked={availability[day].available}
                                        onCheckedChange={() => toggleDay(day, 'available')}
                                    />
                                    <Label className="font-medium">{dayLabels[day]}</Label>
                                </div>

                                {availability[day].available && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => toggleShift(day, 'halfDay')}
                                            className={cn(
                                                "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                                                availability[day].halfDay
                                                    ? "bg-yellow-500/20 text-yellow-600"
                                                    : "bg-secondary text-muted-foreground"
                                            )}
                                        >
                                            <Sun className="h-3 w-3" />
                                            Half
                                        </button>
                                        <button
                                            onClick={() => toggleShift(day, 'fullDay')}
                                            className={cn(
                                                "flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors",
                                                availability[day].fullDay
                                                    ? "bg-blue-500/20 text-blue-600"
                                                    : "bg-secondary text-muted-foreground"
                                            )}
                                        >
                                            <Moon className="h-3 w-3" />
                                            Full
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <Button onClick={saveAvailability} className="w-full mt-6" disabled={isSaving}>
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Availability
                    </Button>
                </CardContent>
            </Card>

            {/* Block Specific Dates */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Block Dates</CardTitle>
                            <CardDescription>
                                Mark specific dates when you're unavailable.
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="min-w-[140px] text-center font-medium">{monthName}</span>
                            <Button variant="outline" size="icon" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                                {day}
                            </div>
                        ))}

                        {days.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const isBlocked = isDateBlocked(date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => !isPast && toggleBlockedDate(date)}
                                    disabled={isPast}
                                    className={cn(
                                        "aspect-square flex items-center justify-center text-sm rounded-lg transition-colors",
                                        isPast && "text-muted-foreground/40 cursor-not-allowed",
                                        !isPast && !isBlocked && "hover:bg-accent",
                                        isBlocked && "bg-destructive/10 text-destructive",
                                        isToday && !isBlocked && "ring-2 ring-accent"
                                    )}
                                >
                                    {date.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    {/* Blocked Dates List */}
                    {blockedDates.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2">Blocked Dates</h4>
                            <div className="flex flex-wrap gap-2">
                                {blockedDates.map(bd => (
                                    <Badge
                                        key={bd.date.toISOString()}
                                        variant="secondary"
                                        className="cursor-pointer"
                                        onClick={() => toggleBlockedDate(bd.date)}
                                    >
                                        {bd.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        <span className="ml-1 text-destructive">×</span>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-xs text-muted-foreground mt-4">
                        Click on a date to block/unblock it. Blocked dates will not show you as available for stints.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

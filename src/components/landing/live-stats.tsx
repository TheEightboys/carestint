"use client";

import { useState, useEffect } from 'react';
import { Users, Building, Briefcase, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    icon: React.ElementType;
    value: number;
    label: string;
    suffix?: string;
    prefix?: string;
    color: string;
    delay: number;
}

function AnimatedCounter({ value, duration = 2000 }: { value: number; duration?: number }) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTime: number | null = null;
        const startValue = 0;

        const animate = (timestamp: number) => {
            if (!startTime) startTime = timestamp;
            const progress = Math.min((timestamp - startTime) / duration, 1);

            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            setCount(Math.floor(startValue + (value - startValue) * easeOutQuart));

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    return <span>{count.toLocaleString()}</span>;
}

function StatCard({ icon: Icon, value, label, suffix = '', prefix = '', color, delay }: StatCardProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return (
        <div
            className={cn(
                "relative group p-6 rounded-2xl bg-card/50 backdrop-blur border transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
                "hover:scale-105 hover:shadow-lg"
            )}
        >
            <div className={cn(
                "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity",
                `bg-gradient-to-br ${color}`
            )} style={{ opacity: 0.05 }} />

            <div className={cn(
                "inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4",
                `bg-gradient-to-br ${color}`
            )}>
                <Icon className="h-6 w-6 text-white" />
            </div>

            <div className="text-3xl md:text-4xl font-bold font-headline mb-1">
                {prefix}
                {isVisible ? <AnimatedCounter value={value} /> : 0}
                {suffix}
            </div>
            <p className="text-muted-foreground text-sm">{label}</p>
        </div>
    );
}

export function LiveStats() {
    const stats = [
        {
            icon: Users,
            value: 700,
            label: "Verified Professionals",
            suffix: "+",
            color: "from-blue-500 to-blue-600"
        },
        {
            icon: Building,
            value: 100,
            label: "Partner Facilities",
            suffix: "+",
            color: "from-purple-500 to-purple-600"
        },
        {
            icon: Briefcase,
            value: 4500,
            label: "Stints Completed",
            suffix: "+",
            color: "from-green-500 to-green-600"
        }
    ];

    return (
        <section className="py-16 bg-secondary/30">
            <div className="container mx-auto px-4">
                <div className="text-center mb-10">
                    <h2 className="font-headline text-2xl md:text-3xl font-bold mb-2">
                        Platform <span className="text-accent">Statistics</span>
                    </h2>
                    <p className="text-muted-foreground">
                        Real numbers from our growing healthcare staffing network
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {stats.map((stat, index) => (
                        <StatCard
                            key={stat.label}
                            icon={stat.icon}
                            value={stat.value}
                            label={stat.label}
                            suffix={stat.suffix}
                            color={stat.color}
                            delay={index * 100}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

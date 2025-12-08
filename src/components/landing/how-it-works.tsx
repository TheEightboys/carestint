"use client";

import { useState } from 'react';
import { Building, UserCheck, Briefcase, Clock, CreditCard, Star, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const employerSteps = [
    {
        icon: Building,
        title: "Create Your Facility Profile",
        description: "Register your Employer/Facility with your license details and get verified within 24 hours.",
        color: "from-blue-500 to-blue-600"
    },
    {
        icon: Briefcase,
        title: "Post a Stint",
        description: "Describe the role, shift type, date, and rate. Our AI flags any issues before publishing.",
        color: "from-purple-500 to-purple-600"
    },
    {
        icon: UserCheck,
        title: "Review Applications",
        description: "Receive applications from verified professionals. View their ratings, experience, and license status.",
        color: "from-green-500 to-green-600"
    },
    {
        icon: CheckCircle2,
        title: "Confirm & Match",
        description: "Select the best candidate and confirm the booking. Both parties receive instant notifications.",
        color: "from-orange-500 to-orange-600"
    },
    {
        icon: Clock,
        title: "Work the Shift",
        description: "Track clock-in/out times automatically. Get notified of any issues in real-time.",
        color: "from-teal-500 to-teal-600"
    },
    {
        icon: Star,
        title: "Rate & Complete",
        description: "After the dispute window closes, payment is automatically processed and you can rate the professional.",
        color: "from-pink-500 to-pink-600"
    }
];

const professionalSteps = [
    {
        icon: UserCheck,
        title: "Complete Your Profile",
        description: "Upload your license, ID, and set your rates. Verification takes under 24 hours.",
        color: "from-teal-500 to-teal-600"
    },
    {
        icon: Briefcase,
        title: "Browse Available Stints",
        description: "Find stints matching your role, location, and schedule preferences.",
        color: "from-blue-500 to-blue-600"
    },
    {
        icon: CheckCircle2,
        title: "Apply or Bid",
        description: "Apply at the listed rate or submit your own bid. Include a message to stand out.",
        color: "from-purple-500 to-purple-600"
    },
    {
        icon: Building,
        title: "Get Matched",
        description: "Receive confirmation when an employer accepts your application.",
        color: "from-orange-500 to-orange-600"
    },
    {
        icon: Clock,
        title: "Work the Shift",
        description: "Clock in on arrival and clock out when done. Your hours are tracked automatically.",
        color: "from-green-500 to-green-600"
    },
    {
        icon: CreditCard,
        title: "Get Paid",
        description: "Receive payment via M-Pesa within 24 hours of the dispute window closing.",
        color: "from-pink-500 to-pink-600"
    }
];

export function HowItWorks() {
    const [activeTab, setActiveTab] = useState<'employer' | 'professional'>('employer');

    const steps = activeTab === 'employer' ? employerSteps : professionalSteps;

    return (
        <section id="how-it-works" className="py-20 bg-gradient-to-b from-background to-secondary/20">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
                        How It <span className="text-accent">Works</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        Whether you're a healthcare facility looking to fill shifts or a professional seeking opportunities,
                        CareStint makes the process seamless and secure.
                    </p>
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex rounded-full bg-secondary/50 p-1 backdrop-blur">
                        <Button
                            variant={activeTab === 'employer' ? 'default' : 'ghost'}
                            className={cn(
                                "rounded-full px-6 transition-all",
                                activeTab === 'employer' && "bg-primary text-primary-foreground"
                            )}
                            onClick={() => setActiveTab('employer')}
                        >
                            <Building className="mr-2 h-4 w-4" />
                            For Employers
                        </Button>
                        <Button
                            variant={activeTab === 'professional' ? 'default' : 'ghost'}
                            className={cn(
                                "rounded-full px-6 transition-all",
                                activeTab === 'professional' && "bg-accent text-accent-foreground"
                            )}
                            onClick={() => setActiveTab('professional')}
                        >
                            <UserCheck className="mr-2 h-4 w-4" />
                            For Professionals
                        </Button>
                    </div>
                </div>

                {/* Vertical Steps List - All steps visible at once */}
                <div className="max-w-3xl mx-auto">
                    <div className="relative">
                        {/* Vertical line connecting steps */}
                        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-primary to-accent/50" />

                        {/* Steps */}
                        <div className="space-y-6">
                            {steps.map((step, index) => {
                                const Icon = step.icon;
                                return (
                                    <div
                                        key={index}
                                        className="relative flex items-start gap-6 group"
                                    >
                                        {/* Step icon */}
                                        <div className={cn(
                                            "relative z-10 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl",
                                            step.color
                                        )}>
                                            <Icon className="h-7 w-7 text-white" />
                                        </div>

                                        {/* Step content */}
                                        <div className="flex-1 bg-card/50 backdrop-blur rounded-xl border p-5 transition-all duration-300 group-hover:border-accent/50 group-hover:bg-card/80">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-xs font-semibold text-accent uppercase tracking-wider">
                                                    Step {index + 1}
                                                </span>
                                            </div>
                                            <h3 className="font-headline text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                                                {step.title}
                                            </h3>
                                            <p className="text-muted-foreground text-sm leading-relaxed">
                                                {step.description}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

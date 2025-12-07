"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building, UserCheck, Briefcase, Clock, CreditCard, Star, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const employerSteps = [
    {
        icon: Building,
        title: "Create Your Facility Profile",
        description: "Register your clinic or hospital with your license details and get verified within 24 hours.",
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
        icon: Clock,
        title: "Manage the Shift",
        description: "Track clock-in/out times automatically. Get notified of any issues in real-time.",
        color: "from-orange-500 to-orange-600"
    },
    {
        icon: Star,
        title: "Rate & Complete",
        description: "After the dispute window closes, payment is automatically processed and you can rate the professional.",
        color: "from-teal-500 to-teal-600"
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
        icon: Clock,
        title: "Work the Shift",
        description: "Clock in on arrival and clock out when done. Your hours are tracked automatically.",
        color: "from-orange-500 to-orange-600"
    },
    {
        icon: CreditCard,
        title: "Get Paid",
        description: "Receive payment via M-Pesa within 24 hours of the dispute window closing.",
        color: "from-green-500 to-green-600"
    }
];

export function HowItWorks() {
    const [activeTab, setActiveTab] = useState<'employer' | 'professional'>('employer');
    const [activeStep, setActiveStep] = useState(0);

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
                            onClick={() => { setActiveTab('employer'); setActiveStep(0); }}
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
                            onClick={() => { setActiveTab('professional'); setActiveStep(0); }}
                        >
                            <UserCheck className="mr-2 h-4 w-4" />
                            For Professionals
                        </Button>
                    </div>
                </div>

                {/* Steps Display */}
                <div className="max-w-5xl mx-auto">
                    {/* Step Indicators */}
                    <div className="flex justify-between items-center mb-8 relative">
                        {/* Progress Line */}
                        <div className="absolute top-1/2 left-0 right-0 h-1 bg-secondary -translate-y-1/2 z-0">
                            <div
                                className={cn(
                                    "h-full transition-all duration-500",
                                    activeTab === 'employer' ? "bg-primary" : "bg-accent"
                                )}
                                style={{ width: `${(activeStep / (steps.length - 1)) * 100}%` }}
                            />
                        </div>

                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = index === activeStep;
                            const isCompleted = index < activeStep;

                            return (
                                <button
                                    key={index}
                                    onClick={() => setActiveStep(index)}
                                    className={cn(
                                        "relative z-10 flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300",
                                        isActive && "scale-125",
                                        isActive || isCompleted
                                            ? activeTab === 'employer'
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-accent text-accent-foreground"
                                            : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                    )}
                                >
                                    {isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                    ) : (
                                        <Icon className="h-5 w-5" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Step Content */}
                    <div className="bg-card/50 backdrop-blur rounded-2xl border p-8 min-h-[200px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeTab}-${activeStep}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="text-center"
                            >
                                <div className={cn(
                                    "inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br mb-6",
                                    steps[activeStep].color
                                )}>
                                    {(() => {
                                        const Icon = steps[activeStep].icon;
                                        return <Icon className="h-8 w-8 text-white" />;
                                    })()}
                                </div>
                                <h3 className="font-headline text-2xl font-semibold mb-4">
                                    Step {activeStep + 1}: {steps[activeStep].title}
                                </h3>
                                <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                                    {steps[activeStep].description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between mt-6">
                        <Button
                            variant="outline"
                            onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                            disabled={activeStep === 0}
                        >
                            Previous
                        </Button>
                        <Button
                            onClick={() => setActiveStep(Math.min(steps.length - 1, activeStep + 1))}
                            disabled={activeStep === steps.length - 1}
                            className={activeTab === 'employer' ? '' : 'bg-accent hover:bg-accent/90'}
                        >
                            Next Step
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}

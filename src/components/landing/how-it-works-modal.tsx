import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Stethoscope, CheckCircle2, ArrowRight } from "lucide-react";

const employerSteps = [
    {
        step: "01",
        title: "Create profile",
        description: "Set up your clinic profile with basic info, license details, and contact person. Once verified, you can post shifts.",
        icon: "🏥"
    },
    {
        step: "02",
        title: "Post a stint",
        description: "Choose Half-day or Full-day, set the offered rate (Ksh, UGx, TZs etc), and add details. You can allow bids for counter-offers or set amount.",
        icon: "📝"
    },
    {
        step: "03",
        title: "Confirm & track",
        description: "Once a professional applies, you can choose to confirm or decline the pro. Track check-in/out and get a simple receipt.",
        icon: "✅"
    },
    {
        step: "04",
        title: "Payments",
        description: "You will only be charged once a professional has been confirmed and scheduled. Transparent fees, no surprises.",
        icon: "💳"
    }
];

const professionalSteps = [
    {
        step: "01",
        title: "Create profile",
        description: "Add your qualifications, preferred locations and availability. Submit credentials and upload documents for review — all profiles are verified before approval.",
        icon: "👤"
    },
    {
        step: "02",
        title: "Apply or bid",
        description: "Once approved, you can apply to shifts at the posted rate or send your bid if allowed. See full stint details before committing.",
        icon: "🎯"
    },
    {
        step: "03",
        title: "Work & get paid",
        description: "Complete the shift. We send your payout less the 5% platform/service fee and M-Pesa charge. Quick, automatic payments.",
        icon: "💰"
    }
];

export function HowItWorksModalContent() {
    return (
        <Tabs defaultValue="employers" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="employers" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                    <Building2 className="h-4 w-4" />
                    For Employers & Facilities
                </TabsTrigger>
                <TabsTrigger value="professionals" className="flex items-center gap-2 data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                    <Stethoscope className="h-4 w-4" />
                    For Professionals
                </TabsTrigger>
            </TabsList>

            <TabsContent value="employers" className="space-y-4">
                <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Getting started is easy.</span> Create your clinic profile, post shifts when you need coverage, and let verified professionals come to you.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    {employerSteps.map((item, index) => (
                        <Card key={item.step} className="group relative bg-gradient-to-br from-secondary/80 to-secondary/40 border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg overflow-hidden">
                            {/* Step number background */}
                            <div className="absolute -top-4 -right-4 text-8xl font-bold font-headline text-muted-foreground/5 group-hover:text-accent/10 transition-colors">
                                {item.step}
                            </div>

                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-accent uppercase tracking-wider">Step {item.step}</div>
                                        <CardTitle className="font-headline text-xl group-hover:text-accent transition-colors">{item.title}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                            </CardContent>

                            {/* Arrow connector */}
                            {index < employerSteps.length - 1 && index % 2 === 0 && (
                                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 text-accent/30">
                                    <ArrowRight className="h-6 w-6" />
                                </div>
                            )}
                        </Card>
                    ))}
                </div>

                {/* Key benefits */}
                <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
                    {[
                        { icon: <CheckCircle2 className="h-4 w-4 text-accent" />, text: "Verified pros only" },
                        { icon: <CheckCircle2 className="h-4 w-4 text-accent" />, text: "Pay on confirmation" },
                        { icon: <CheckCircle2 className="h-4 w-4 text-accent" />, text: "24/7 support" },
                    ].map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {benefit.icon}
                            <span>{benefit.text}</span>
                        </div>
                    ))}
                </div>
            </TabsContent>

            <TabsContent value="professionals" className="space-y-4">
                <div className="mb-6 p-4 rounded-lg bg-accent/10 border border-accent/20">
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">Your skills, your schedule.</span> Get verified once, then apply to shifts that match your availability and earn on your terms.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    {professionalSteps.map((item, index) => (
                        <Card key={item.step} className="group relative bg-gradient-to-br from-secondary/80 to-secondary/40 border-border/50 hover:border-accent/30 transition-all duration-300 hover:shadow-lg overflow-hidden">
                            {/* Step number background */}
                            <div className="absolute -top-4 -right-4 text-8xl font-bold font-headline text-muted-foreground/5 group-hover:text-accent/10 transition-colors">
                                {item.step}
                            </div>

                            <CardHeader className="pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-2xl group-hover:scale-110 transition-transform">
                                        {item.icon}
                                    </div>
                                    <div>
                                        <div className="text-xs font-semibold text-accent uppercase tracking-wider">Step {item.step}</div>
                                        <CardTitle className="font-headline text-xl group-hover:text-accent transition-colors">{item.title}</CardTitle>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Key benefits */}
                <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
                    {[
                        { icon: <CheckCircle2 className="h-4 w-4 text-accent" />, text: "Flexible schedule" },
                        { icon: <CheckCircle2 className="h-4 w-4 text-accent" />, text: "Fast M-Pesa payouts" },
                        { icon: <CheckCircle2 className="h-4 w-4 text-accent" />, text: "Verified clinics" },
                    ].map((benefit, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            {benefit.icon}
                            <span>{benefit.text}</span>
                        </div>
                    ))}
                </div>
            </TabsContent>
        </Tabs>
    );
}

"use client";

import { useState, useEffect } from 'react';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const testimonials = [
    {
        id: 1,
        name: "Dr. Sarah Wanjiku",
        role: "Medical Director",
        facility: "Nairobi Premier Clinic",
        avatar: "SW",
        rating: 5,
        text: "CareStint has transformed how we handle staffing shortages. We can now fill urgent shifts within hours instead of days. The quality of professionals on the platform is exceptional.",
        type: "employer"
    },
    {
        id: 2,
        name: "James Ochieng",
        role: "Registered Nurse",
        facility: "Freelance Professional",
        avatar: "JO",
        rating: 5,
        text: "As a nurse looking for flexible work, CareStint is perfect. I choose when and where I work, and the automated payments via M-Pesa are always on time. Highly recommended!",
        type: "professional"
    },
    {
        id: 3,
        name: "Dr. Michael Kiprop",
        role: "Hospital Administrator",
        facility: "Eldoret Medical Center",
        avatar: "MK",
        rating: 5,
        text: "The verification process gives us confidence that every professional we hire is fully licensed and qualified. The risk scoring feature is incredibly helpful.",
        type: "employer"
    },
    {
        id: 4,
        name: "Grace Muthoni",
        role: "Clinical Officer",
        facility: "Freelance Professional",
        avatar: "GM",
        rating: 5,
        text: "I've worked over 50 stints through CareStint. The platform is easy to use, and I love being able to see my earnings and ratings all in one place.",
        type: "professional"
    },
    {
        id: 5,
        name: "Daniel Kimani",
        role: "Operations Manager",
        facility: "Mombasa General Hospital",
        avatar: "DK",
        rating: 5,
        text: "The automated KYC verification and dispute resolution features save us hours of administrative work. It's the most efficient staffing solution we've used.",
        type: "employer"
    }
];

export function Testimonials() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isAutoPlaying, setIsAutoPlaying] = useState(true);

    useEffect(() => {
        if (!isAutoPlaying) return;

        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % testimonials.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAutoPlaying]);

    const handlePrev = () => {
        setIsAutoPlaying(false);
        setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const handleNext = () => {
        setIsAutoPlaying(false);
        setActiveIndex((prev) => (prev + 1) % testimonials.length);
    };

    return (
        <section className="py-20 bg-gradient-to-b from-secondary/20 to-background">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="font-headline text-3xl md:text-4xl font-bold mb-4">
                        Trusted by <span className="text-accent">Healthcare Heroes</span>
                    </h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">
                        See what employers and professionals say about their experience with CareStint.
                    </p>
                </div>

                {/* Trust Badges */}
                <div className="flex flex-wrap justify-center gap-6 mb-12">
                    <div className="flex items-center gap-2 bg-card/50 backdrop-blur rounded-full px-4 py-2 border">
                        <div className="flex">
                            {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ))}
                        </div>
                        <span className="text-sm font-medium">4.9/5 Average Rating</span>
                    </div>
                    <div className="bg-card/50 backdrop-blur rounded-full px-4 py-2 border">
                        <span className="text-sm font-medium">500+ Verified Professionals</span>
                    </div>
                    <div className="bg-card/50 backdrop-blur rounded-full px-4 py-2 border">
                        <span className="text-sm font-medium">100+ Partner Facilities</span>
                    </div>
                    <div className="bg-card/50 backdrop-blur rounded-full px-4 py-2 border">
                        <span className="text-sm font-medium">10,000+ Stints Completed</span>
                    </div>
                </div>

                {/* Testimonial Carousel */}
                <div className="max-w-4xl mx-auto relative">
                    <div className="bg-card/50 backdrop-blur rounded-2xl border p-8 md:p-12">
                        <Quote className="h-12 w-12 text-accent/20 mb-6" />

                        <div className="min-h-[180px]">
                            <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
                                "{testimonials[activeIndex].text}"
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-14 h-14 rounded-full flex items-center justify-center text-lg font-semibold",
                                    testimonials[activeIndex].type === 'employer'
                                        ? "bg-primary/20 text-primary"
                                        : "bg-accent/20 text-accent"
                                )}>
                                    {testimonials[activeIndex].avatar}
                                </div>
                                <div>
                                    <h4 className="font-semibold">{testimonials[activeIndex].name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {testimonials[activeIndex].role} • {testimonials[activeIndex].facility}
                                    </p>
                                </div>
                            </div>
                            <div className="hidden sm:flex">
                                {[1, 2, 3, 4, 5].map(i => (
                                    <Star
                                        key={i}
                                        className={cn(
                                            "h-5 w-5",
                                            i <= testimonials[activeIndex].rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-muted"
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Navigation Buttons */}
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rounded-full hidden md:flex"
                        onClick={handlePrev}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full hidden md:flex"
                        onClick={handleNext}
                    >
                        <ChevronRight className="h-5 w-5" />
                    </Button>

                    {/* Dots Indicator */}
                    <div className="flex justify-center gap-2 mt-6">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => { setActiveIndex(index); setIsAutoPlaying(false); }}
                                className={cn(
                                    "w-2 h-2 rounded-full transition-all",
                                    index === activeIndex
                                        ? "w-8 bg-accent"
                                        : "bg-muted hover:bg-muted-foreground/50"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

"use client";

import { useLayoutEffect, useRef } from 'react';
import { Smartphone } from 'lucide-react';
import { WaitlistModal } from './waitlist-modal';
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function MobileAppShowcase() {
    const sectionRef = useRef<HTMLDivElement>(null);
    const phonesRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            // Badge entrance
            gsap.fromTo(".mobile-badge",
                { opacity: 0, y: 30, scale: 0.9 },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.8,
                    ease: "back.out(1.4)",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );

            // Title animation
            gsap.fromTo(".mobile-title",
                { opacity: 0, y: 40 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: "top 80%",
                        toggleActions: "play none none none"
                    }
                }
            );

            // Phone mockups animation
            gsap.fromTo(".phone-mockup-left",
                { opacity: 0, x: -100, rotateY: 45 },
                {
                    opacity: 1,
                    x: 0,
                    rotateY: 0,
                    duration: 1.2,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: phonesRef.current,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );

            gsap.fromTo(".phone-mockup-right",
                { opacity: 0, x: 100, rotateY: -45 },
                {
                    opacity: 1,
                    x: 0,
                    rotateY: 0,
                    duration: 1.2,
                    ease: "power3.out",
                    scrollTrigger: {
                        trigger: phonesRef.current,
                        start: "top 85%",
                        toggleActions: "play none none none"
                    }
                }
            );

            // Floating animation for phones
            gsap.to(".phone-mockup-left", {
                y: -10,
                duration: 2,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true
            });

            gsap.to(".phone-mockup-right", {
                y: 10,
                duration: 2.5,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true
            });

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={sectionRef}
            className="relative py-16 sm:py-24 bg-gradient-to-b from-background via-secondary/20 to-background overflow-hidden"
        >
            {/* Background decorations */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute left-1/4 top-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
                <div className="absolute right-1/4 bottom-1/3 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h2 className="mobile-title font-headline text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
                        Take <span className="gradient-text">CareStint</span> With You
                    </h2>

                    <p className="mobile-title text-muted-foreground text-lg max-w-2xl mx-auto">
                        Find and manage stints, clock in/out, and get paid — all from your phone.
                    </p>
                </div>

                {/* Phone Mockups */}
                <div ref={phonesRef} className="flex justify-center items-center gap-4 sm:gap-8 mb-10 perspective-1000">
                    {/* iPhone Mockup - CareStint Pro */}
                    <div className="phone-mockup-left relative w-36 h-[18rem] sm:w-48 sm:h-[24rem] md:w-56 md:h-[28rem] rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 p-1.5 sm:p-2 shadow-2xl shadow-accent/20 transform -rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 border border-slate-700/50">
                        {/* iPhone Notch */}
                        <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-16 sm:w-20 h-4 sm:h-5 bg-slate-900 rounded-full z-20" />
                        {/* Side buttons */}
                        <div className="absolute -left-0.5 top-20 sm:top-24 w-0.5 sm:w-1 h-6 sm:h-8 bg-slate-700 rounded-l-sm" />
                        <div className="absolute -left-0.5 top-32 sm:top-36 w-0.5 sm:w-1 h-10 sm:h-12 bg-slate-700 rounded-l-sm" />
                        <div className="absolute -right-0.5 top-24 sm:top-28 w-0.5 sm:w-1 h-8 sm:h-10 bg-slate-700 rounded-r-sm" />

                        {/* Screen - Professional App UI */}
                        <div className="w-full h-full rounded-[1.75rem] sm:rounded-[2rem] overflow-hidden relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
                            {/* Status Bar */}
                            <div className="h-6 sm:h-8 flex items-center justify-between px-4 pt-2 text-[8px] sm:text-[10px] text-white/60">
                                <span>9:41</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-1.5 bg-white/60 rounded-sm" />
                                    <div className="w-3 h-1.5 bg-white/60 rounded-sm" />
                                </div>
                            </div>

                            {/* App Header */}
                            <div className="px-3 sm:px-4 pt-2 pb-2">
                                <div className="text-[10px] sm:text-xs text-accent">Good morning!</div>
                                <div className="text-sm sm:text-base font-bold text-white">Find Your Stint</div>
                            </div>

                            {/* Stint Cards */}
                            <div className="px-2 sm:px-3 space-y-1.5 sm:space-y-2">
                                {/* Stint 1 */}
                                <div className="bg-slate-800/80 rounded-lg p-2 sm:p-2.5 border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[9px] sm:text-[11px] font-semibold text-white">RN - Full Day</div>
                                        <div className="text-[8px] sm:text-[10px] font-bold text-accent">KSh 5,500</div>
                                    </div>
                                    <div className="text-[7px] sm:text-[9px] text-slate-400">Nairobi Hospital • 8 AM</div>
                                    <div className="mt-1.5 flex gap-1">
                                        <div className="px-1.5 py-0.5 bg-accent/20 rounded text-[6px] sm:text-[8px] text-accent">Apply</div>
                                    </div>
                                </div>
                                {/* Stint 2 */}
                                <div className="bg-slate-800/80 rounded-lg p-2 sm:p-2.5 border border-slate-700/50">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[9px] sm:text-[11px] font-semibold text-white">Lab Tech</div>
                                        <div className="text-[8px] sm:text-[10px] font-bold text-accent">KSh 4,000</div>
                                    </div>
                                    <div className="text-[7px] sm:text-[9px] text-slate-400">Rusinga • Half-day</div>
                                    <div className="mt-1.5 flex gap-1">
                                        <div className="px-1.5 py-0.5 bg-accent/20 rounded text-[6px] sm:text-[8px] text-accent">Apply</div>
                                    </div>
                                </div>
                                {/* Stint 3 */}
                                <div className="bg-slate-800/80 rounded-lg p-2 sm:p-2.5 border border-slate-700/50 hidden sm:block">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="text-[9px] sm:text-[11px] font-semibold text-white">Pharmacist</div>
                                        <div className="text-[8px] sm:text-[10px] font-bold text-accent">KSh 6,000</div>
                                    </div>
                                    <div className="text-[7px] sm:text-[9px] text-slate-400">Karen Hospital • Full Day</div>
                                </div>
                            </div>

                            {/* Bottom Nav */}
                            <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 p-2 sm:p-3">
                                <div className="flex justify-around items-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-accent/20 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-accent" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-accent mt-0.5">Home</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-700/50 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-slate-500" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-slate-500 mt-0.5">Search</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-700/50 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-slate-500" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-slate-500 mt-0.5">Stints</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-700/50 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-slate-500" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-slate-500 mt-0.5">Profile</span>
                                    </div>
                                </div>
                            </div>

                            {/* App Label Overlay */}
                            <div className="absolute bottom-10 sm:bottom-14 left-0 right-0 text-center">
                                <div className="text-xs sm:text-sm font-bold text-white/80">CareStint Pro</div>
                                <div className="text-[8px] sm:text-[10px] text-accent/80">For Professionals</div>
                            </div>
                        </div>

                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-accent/30 to-primary/30 rounded-[2.5rem] sm:rounded-[3rem] blur-xl opacity-50 -z-10" />
                    </div>

                    {/* Android Mockup - CareStint Hire */}
                    <div className="phone-mockup-right relative w-36 h-[18rem] sm:w-48 sm:h-[24rem] md:w-56 md:h-[28rem] rounded-[1.75rem] sm:rounded-[2rem] bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 p-1.5 sm:p-2 shadow-2xl shadow-primary/20 transform rotate-6 hover:rotate-0 hover:scale-105 transition-all duration-500 border border-slate-700/50">
                        {/* Android Camera Dot */}
                        <div className="absolute top-2 sm:top-3 left-1/2 -translate-x-1/2 w-2 sm:w-2.5 h-2 sm:h-2.5 bg-slate-600 rounded-full z-20 ring-1 ring-slate-500" />
                        {/* Volume buttons */}
                        <div className="absolute -right-0.5 top-16 sm:top-20 w-0.5 sm:w-1 h-6 sm:h-8 bg-slate-700 rounded-r-sm" />
                        <div className="absolute -right-0.5 top-28 sm:top-32 w-0.5 sm:w-1 h-6 sm:h-8 bg-slate-700 rounded-r-sm" />

                        {/* Screen - Employer App UI */}
                        <div className="w-full h-full rounded-[1.25rem] sm:rounded-[1.5rem] overflow-hidden relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800">
                            {/* Status Bar */}
                            <div className="h-5 sm:h-7 flex items-center justify-between px-3 sm:px-4 pt-1.5 text-[8px] sm:text-[10px] text-white/60">
                                <span>9:41</span>
                                <div className="flex gap-1">
                                    <div className="w-3 h-1.5 bg-white/60 rounded-sm" />
                                </div>
                            </div>

                            {/* App Header */}
                            <div className="px-3 sm:px-4 pt-1 pb-2">
                                <div className="text-[10px] sm:text-xs text-primary">Your Facility</div>
                                <div className="text-sm sm:text-base font-bold text-white">Rusinga Nursing Home</div>
                            </div>

                            {/* Stats Row */}
                            <div className="px-2 sm:px-3 grid grid-cols-3 gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                                <div className="bg-accent/10 rounded-lg p-1.5 sm:p-2 text-center border border-accent/20">
                                    <div className="text-[10px] sm:text-sm font-bold text-accent">3</div>
                                    <div className="text-[6px] sm:text-[8px] text-slate-400">Active</div>
                                </div>
                                <div className="bg-primary/10 rounded-lg p-1.5 sm:p-2 text-center border border-primary/20">
                                    <div className="text-[10px] sm:text-sm font-bold text-primary">8</div>
                                    <div className="text-[6px] sm:text-[8px] text-slate-400">Applicants</div>
                                </div>
                                <div className="bg-green-500/10 rounded-lg p-1.5 sm:p-2 text-center border border-green-500/20">
                                    <div className="text-[10px] sm:text-sm font-bold text-green-400">12</div>
                                    <div className="text-[6px] sm:text-[8px] text-slate-400">Completed</div>
                                </div>
                            </div>

                            {/* Today's Stints */}
                            <div className="px-2 sm:px-3">
                                <div className="text-[8px] sm:text-[10px] font-semibold text-slate-400 mb-1 sm:mb-1.5">TODAY'S STINTS</div>
                                {/* Stint Card */}
                                <div className="bg-slate-800/80 rounded-lg p-2 sm:p-2.5 border border-slate-700/50 mb-1.5 sm:mb-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-[9px] sm:text-[11px] font-semibold text-white">Clinical Officer</div>
                                            <div className="text-[7px] sm:text-[9px] text-slate-400">8 AM - 5 PM</div>
                                        </div>
                                        <div className="px-1.5 py-0.5 bg-green-500/20 rounded text-[6px] sm:text-[8px] text-green-400">Confirmed</div>
                                    </div>
                                </div>
                                <div className="bg-slate-800/80 rounded-lg p-2 sm:p-2.5 border border-slate-700/50 hidden sm:block">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="text-[9px] sm:text-[11px] font-semibold text-white">Registered Nurse</div>
                                            <div className="text-[7px] sm:text-[9px] text-slate-400">12 PM - 6 PM</div>
                                        </div>
                                        <div className="px-1.5 py-0.5 bg-yellow-500/20 rounded text-[6px] sm:text-[8px] text-yellow-400">3 Applied</div>
                                    </div>
                                </div>
                            </div>

                            {/* Post Button */}
                            <div className="absolute bottom-10 sm:bottom-14 left-1/2 -translate-x-1/2">
                                <div className="bg-primary px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[8px] sm:text-[10px] font-semibold text-white shadow-lg">
                                    + Post Stint
                                </div>
                            </div>

                            {/* Bottom Nav */}
                            <div className="absolute bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700/50 p-2 sm:p-3">
                                <div className="flex justify-around items-center">
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-primary/20 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-primary" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-primary mt-0.5">Home</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-700/50 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-slate-500" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-slate-500 mt-0.5">Stints</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-700/50 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-slate-500" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-slate-500 mt-0.5">Apps</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded bg-slate-700/50 flex items-center justify-center">
                                            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-sm bg-slate-500" />
                                        </div>
                                        <span className="text-[6px] sm:text-[7px] text-slate-500 mt-0.5">Settings</span>
                                    </div>
                                </div>
                            </div>

                            {/* App Label Overlay */}
                            <div className="absolute bottom-[4.5rem] sm:bottom-[5.5rem] left-0 right-0 text-center">
                                <div className="text-xs sm:text-sm font-bold text-white/80">CareStint Hire</div>
                                <div className="text-[8px] sm:text-[10px] text-primary/80">For Employers</div>
                            </div>
                        </div>

                        {/* Glow effect */}
                        <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 to-accent/30 rounded-[2rem] sm:rounded-[2.5rem] blur-xl opacity-50 -z-10" />
                    </div>
                </div>

                {/* CTA Section */}
                <div className="text-center">
                    <WaitlistModal />
                    <p className="text-xs text-muted-foreground mt-4">
                        Be the first to know when our mobile apps launch
                    </p>
                </div>
            </div>
        </section>
    );
}

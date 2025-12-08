"use client";

import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { Heart, Mail, Phone, MapPin, Twitter, Linkedin, Facebook } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    const scrollToHowItWorks = (tab: 'employer' | 'professional') => {
        const element = document.getElementById('how-it-works');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
            // After scrolling, trigger a click on the appropriate tab
            setTimeout(() => {
                const button = document.querySelector(
                    tab === 'employer'
                        ? 'button:has(.lucide-building)'
                        : 'button:has(.lucide-user-check)'
                ) as HTMLButtonElement;
                if (button) button.click();
            }, 500);
        }
    };

    return (
        <footer className="relative border-t bg-gradient-to-b from-background to-secondary/30">
            {/* Decorative top border */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            <div className="container mx-auto px-4 py-12">
                <div className="grid gap-8 md:grid-cols-3">
                    {/* Brand */}
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center space-x-2">
                            <Logo className="h-6 w-auto" />
                        </Link>
                        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                            Smart, automated healthcare staffing for East & Central Africa. Connecting Employers/Facilities with verified professionals.
                        </p>
                        <div className="flex items-center gap-4 pt-2">
                            <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                                <Twitter className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                                <Linkedin className="h-5 w-5" />
                            </a>
                            <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
                                <Facebook className="h-5 w-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick links */}
                    <div className="space-y-4">
                        <h4 className="font-headline font-semibold text-foreground">Platform</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <button
                                    onClick={() => scrollToHowItWorks('employer')}
                                    className="text-muted-foreground hover:text-accent transition-colors"
                                >
                                    For Employers/Facilities
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => scrollToHowItWorks('professional')}
                                    className="text-muted-foreground hover:text-accent transition-colors"
                                >
                                    For Professionals
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h4 className="font-headline font-semibold text-foreground">Contact</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2 text-muted-foreground">
                                <Mail className="h-4 w-4 text-accent" />
                                <span>hello@carestint.com</span>
                            </li>
                            <li className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="h-4 w-4 text-accent" />
                                <span>+254 700 000 000</span>
                            </li>
                            <li className="flex items-start gap-2 text-muted-foreground">
                                <MapPin className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                                <span>Nairobi, Kenya</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-6 border-t border-border/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                        <p className="flex items-center gap-1">
                            Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> for healthcare in Africa
                        </p>
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/superadmin" className="opacity-30 hover:opacity-100 transition-opacity text-xs">
                                Admin
                            </Link>
                            <p>© {currentYear} CareStint. All rights reserved.</p>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}

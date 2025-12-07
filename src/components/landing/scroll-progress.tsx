"use client";

import { useEffect, useState } from 'react';

export function ScrollProgress() {
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const windowHeight = window.innerHeight;
            const documentHeight = document.documentElement.scrollHeight - windowHeight;
            const scrolled = window.scrollY;
            const progress = (scrolled / documentHeight) * 100;
            setScrollProgress(progress);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="fixed left-0 top-0 z-50 h-1 w-full bg-secondary/30">
            <div
                className="h-full bg-gradient-to-r from-accent to-primary transition-all duration-300 ease-out"
                style={{ width: `${scrollProgress}%` }}
            />
        </div>
    );
}

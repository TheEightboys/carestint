"use client";

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Activity, Stethoscope, Plus } from 'lucide-react';

export function FloatingElements() {
    const containerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        const elements = containerRef.current.querySelectorAll('.float-element');

        // Create natural parallax effect on mouse move
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            elements.forEach((element, index) => {
                const depth = (index + 1) * 0.02; // Different parallax depths
                const moveX = (clientX - centerX) * depth;
                const moveY = (clientY - centerY) * depth;

                gsap.to(element, {
                    x: moveX,
                    y: moveY,
                    duration: 1,
                    ease: "power2.out",
                });
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        // Initial float animations
        elements.forEach((element, index) => {
            const duration = 8 + index * 2;
            const delay = index * 0.5;

            gsap.to(element, {
                y: "random(-30, 30)",
                duration: duration,
                delay: delay,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
            });

            // Gentle rotation
            gsap.to(element, {
                rotation: "random(-15, 15)",
                duration: duration * 1.5,
                delay: delay,
                ease: "sine.inOut",
                repeat: -1,
                yoyo: true,
            });
        });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            gsap.killTweensOf(elements);
        };
    }, []);

    return (
        <div ref={containerRef} className="pointer-events-none absolute inset-0 overflow-hidden opacity-40">
            <div className="float-element absolute right-[20%] top-[25%]">
                <Activity className="h-16 w-16 text-primary" />
            </div>
            <div className="float-element absolute left-[25%] bottom-[30%]">
                <Stethoscope className="h-14 w-14 text-accent" />
            </div>
            <div className="float-element absolute right-[15%] bottom-[25%]">
                <Plus className="h-20 w-20 text-primary" strokeWidth={1.5} />
            </div>
            <div className="float-element absolute left-[15%] top-[15%]">
                <Activity className="h-12 w-12 text-accent" />
            </div>
        </div>
    );
}

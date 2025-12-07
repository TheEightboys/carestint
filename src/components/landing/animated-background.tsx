"use client";

import { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';

export function AnimatedBackground() {
  const bgRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!bgRef.current) return;

    const orbs = bgRef.current.querySelectorAll('.orb');
    
    // Create natural, organic floating animations for each orb
    orbs.forEach((orb, index) => {
      const duration = 15 + index * 3; // Vary duration for each orb
      const delay = index * 2; // Stagger start times
      
      gsap.to(orb, {
        x: `random(-100, 100)`,
        y: `random(-100, 100)`,
        duration: duration,
        delay: delay,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Add subtle scale pulsing
      gsap.to(orb, {
        scale: `random(0.8, 1.2)`,
        duration: duration / 2,
        delay: delay,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    });

    return () => {
      gsap.killTweensOf(orbs);
    };
  }, []);

  return (
    <div ref={bgRef} className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      
      {/* Floating orbs */}
      <div className="orb absolute left-[10%] top-[20%] h-64 w-64 rounded-full bg-gradient-to-br from-accent/20 to-primary/20 blur-3xl" />
      <div className="orb absolute right-[15%] top-[40%] h-96 w-96 rounded-full bg-gradient-to-br from-primary/15 to-accent/15 blur-3xl" />
      <div className="orb absolute left-[20%] bottom-[30%] h-80 w-80 rounded-full bg-gradient-to-br from-accent/10 to-primary/10 blur-3xl" />
      <div className="orb absolute right-[25%] bottom-[20%] h-72 w-72 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 blur-3xl" />
    </div>
  );
}

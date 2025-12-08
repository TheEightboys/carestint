"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/auth-modal';
import type { UserType } from '@/components/auth/auth-modal';
import { Menu, X, Building, Stethoscope } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export function Header() {
  const [modalOpen, setModalOpen] = useState(false);
  const [userType, setUserType] = useState<UserType>('employer');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignInClick = (type: UserType) => {
    setUserType(type);
    setModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${scrolled
          ? 'border-border/40 bg-background/80 backdrop-blur-md shadow-lg'
          : 'border-border/20 bg-background/60 backdrop-blur-sm'
          }`}
      >
        <div className="container flex h-16 items-center">
          <div className="mr-4 flex flex-1 items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2 group">
              <Logo className="h-6 w-auto transition-transform group-hover:scale-110" />
            </Link>
            <span className="hidden whitespace-nowrap text-sm text-muted-foreground md:inline-block">
              Smart, automated healthcare staffing
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center justify-end space-x-2">
            <Button
              variant="ghost"
              onClick={() => handleSignInClick('employer')}
              className="transition-all duration-300 hover:scale-105"
            >
              Sign in as Employer/Facility
            </Button>
            <Button
              onClick={() => handleSignInClick('professional')}
              className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/30"
            >
              Sign in as Professional
            </Button>
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px]">
                <SheetHeader>
                  <SheetTitle className="text-left font-headline">
                    <Logo className="h-6 w-auto" />
                  </SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <p className="text-sm text-muted-foreground px-2">
                    Smart, automated healthcare staffing
                  </p>
                  <div className="h-px bg-border my-2" />
                  <Button
                    variant="outline"
                    onClick={() => handleSignInClick('employer')}
                    className="w-full justify-start gap-3 h-14 text-left"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">Sign in as Employer</div>
                      <div className="text-xs text-muted-foreground">For Employers/Facilities</div>
                    </div>
                  </Button>
                  <Button
                    onClick={() => handleSignInClick('professional')}
                    className="w-full justify-start gap-3 h-14 text-left bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-foreground/10">
                      <Stethoscope className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-medium">Sign in as Professional</div>
                      <div className="text-xs opacity-80">Healthcare workers</div>
                    </div>
                  </Button>
                  <div className="h-px bg-border my-2" />
                  <div className="px-2 py-4">
                    <p className="text-xs text-muted-foreground">
                      CareStint connects healthcare professionals with Employers/Facilities across East & Central Africa.
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <AuthModal
        isOpen={modalOpen}
        onOpenChange={setModalOpen}
        userType={userType}
      />
    </>
  );
}

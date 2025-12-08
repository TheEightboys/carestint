"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/icons/logo';
import { Button } from '@/components/ui/button';
import { AuthModal } from '@/components/auth/auth-modal';
import type { UserType } from '@/components/auth/auth-modal';
import { Menu, Building, Stethoscope, ArrowRight, LayoutDashboard, LogOut, Loader2 } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useUser } from '@/lib/user-context';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const router = useRouter();
  const { user, userProfile, userRole, isLoading, logout } = useUser();

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userTypePickerOpen, setUserTypePickerOpen] = useState(false);
  const [authAction, setAuthAction] = useState<'signin' | 'signup'>('signin');
  const [userType, setUserType] = useState<UserType>('professional');
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleAuthClick = (action: 'signin' | 'signup') => {
    setAuthAction(action);
    setUserTypePickerOpen(true);
    setMobileMenuOpen(false);
  };

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setUserTypePickerOpen(false);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const getDashboardUrl = () => {
    switch (userRole) {
      case 'superadmin':
        return '/dashboard/superadmin';
      case 'employer':
        return '/dashboard/employer';
      case 'professional':
        return '/dashboard/professional';
      default:
        return '/';
    }
  };

  const getUserInitials = () => {
    if (userProfile?.fullName) {
      return userProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
    if (userProfile?.facilityName) {
      return userProfile.facilityName.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const isLoggedIn = !!user && !!userRole;

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
          <div className="hidden md:flex items-center justify-end gap-4">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : isLoggedIn ? (
              // Logged in - show dashboard button and user menu
              <>
                <Button
                  variant="ghost"
                  onClick={() => router.push(getDashboardUrl())}
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs">
                          {getUserInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">
                        {userProfile?.fullName || userProfile?.facilityName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {userRole}
                      </p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push(getDashboardUrl())}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Go to Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Not logged in - show sign in / create account
              <>
                <Button
                  variant="ghost"
                  onClick={() => handleAuthClick('signin')}
                  className="text-muted-foreground hover:text-foreground transition-all duration-300"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => handleAuthClick('signup')}
                  className="bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/30 font-semibold px-6"
                >
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            )}
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

                  {isLoggedIn ? (
                    // Logged in - mobile menu
                    <>
                      <div className="px-2 py-2">
                        <p className="font-medium">
                          {userProfile?.fullName || userProfile?.facilityName || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          Logged in as {userRole}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          router.push(getDashboardUrl());
                        }}
                        className="w-full justify-start gap-3 h-14 text-left bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-foreground/10">
                          <LayoutDashboard className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Go to Dashboard</div>
                          <div className="text-xs opacity-80">Manage your account</div>
                        </div>
                        <ArrowRight className="h-5 w-5 opacity-60" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full justify-start gap-3 h-12 text-left text-destructive"
                      >
                        <LogOut className="h-5 w-5" />
                        Sign Out
                      </Button>
                    </>
                  ) : (
                    // Not logged in - mobile menu
                    <>
                      <Button
                        onClick={() => handleAuthClick('signup')}
                        className="w-full justify-start gap-3 h-14 text-left bg-accent text-accent-foreground hover:bg-accent/90"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-foreground/10">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">Create Account</div>
                          <div className="text-xs opacity-80">Get started today</div>
                        </div>
                        <ArrowRight className="h-5 w-5 opacity-60" />
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleAuthClick('signin')}
                        className="w-full justify-start gap-3 h-14 text-left"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Building className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">Sign In</div>
                          <div className="text-xs text-muted-foreground">Already have an account</div>
                        </div>
                      </Button>
                    </>
                  )}

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

      {/* User Type Selection Modal */}
      {userTypePickerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setUserTypePickerOpen(false)}
          />
          <div className="relative z-50 w-full max-w-lg mx-4 bg-background border rounded-lg shadow-lg p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="font-semibold text-xl text-center mb-2">
              {authAction === 'signin' ? 'Sign In' : 'Create Account'}
            </h3>
            <p className="text-center text-muted-foreground mb-6">
              Choose how you want to use CareStint
            </p>

            <div className="grid gap-4">
              {/* Professional Option */}
              <button
                onClick={() => handleUserTypeSelect('professional')}
                className="flex items-center gap-4 p-6 rounded-xl border-2 border-border hover:border-accent hover:bg-accent/5 transition-all group text-left"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Stethoscope className="h-7 w-7 text-accent" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-accent transition-colors">
                    I'm a Healthcare Professional
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Nurse, Dentist, Lab Tech, Pharmacist, etc.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-colors" />
              </button>

              {/* Employer Option */}
              <button
                onClick={() => handleUserTypeSelect('employer')}
                className="flex items-center gap-4 p-6 rounded-xl border-2 border-border hover:border-primary hover:bg-primary/5 transition-all group text-left"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <Building className="h-7 w-7 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    I'm an Employer / Facility
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Hospital, Clinic, Nursing Home, Lab, etc.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </button>
            </div>

            <div className="mt-6 text-center">
              <Button variant="ghost" onClick={() => setUserTypePickerOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onOpenChange={setAuthModalOpen}
        userType={userType}
        defaultMode={authAction}
      />
    </>
  );
}

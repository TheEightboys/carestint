"use client";

import { useState, useEffect } from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Theme = 'light' | 'dark' | 'system';

interface ThemeToggleProps {
    variant?: 'default' | 'outline' | 'ghost';
    size?: 'default' | 'sm' | 'lg' | 'icon';
    showLabel?: boolean;
}

export function ThemeToggle({
    variant = 'ghost',
    size = 'icon',
    showLabel = false
}: ThemeToggleProps) {
    const [theme, setTheme] = useState<Theme>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Get initial theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme') as Theme;
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === 'system') {
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                applyTheme(systemTheme);
            } else {
                applyTheme(savedTheme);
            }
        } else {
            // Check system preference
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            setTheme('system');
            applyTheme(systemTheme);
        }

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e: MediaQueryListEvent) => {
            if (theme === 'system') {
                applyTheme(e.matches ? 'dark' : 'light');
            }
        };
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const applyTheme = (newTheme: 'light' | 'dark') => {
        const root = document.documentElement;
        if (newTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    };

    const handleThemeChange = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);

        if (newTheme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            applyTheme(systemTheme);
        } else {
            applyTheme(newTheme);
        }
    };

    // Prevent hydration mismatch
    if (!mounted) {
        return (
            <Button variant={variant} size={size} disabled>
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    const currentIcon =
        theme === 'dark' ? <Moon className="h-4 w-4" /> :
            theme === 'light' ? <Sun className="h-4 w-4" /> :
                <Monitor className="h-4 w-4" />;

    const currentLabel =
        theme === 'dark' ? 'Dark' :
            theme === 'light' ? 'Light' :
                'System';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant={variant} size={size} className="gap-2">
                    {currentIcon}
                    {showLabel && <span>{currentLabel}</span>}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem
                    onClick={() => handleThemeChange('light')}
                    className="gap-2"
                >
                    <Sun className="h-4 w-4" />
                    <span>Light</span>
                    {theme === 'light' && <span className="ml-auto text-accent">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('dark')}
                    className="gap-2"
                >
                    <Moon className="h-4 w-4" />
                    <span>Dark</span>
                    {theme === 'dark' && <span className="ml-auto text-accent">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => handleThemeChange('system')}
                    className="gap-2"
                >
                    <Monitor className="h-4 w-4" />
                    <span>System</span>
                    {theme === 'system' && <span className="ml-auto text-accent">✓</span>}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

// Simple toggle button without dropdown
export function ThemeToggleSimple() {
    const [isDark, setIsDark] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsDark(document.documentElement.classList.contains('dark'));
    }, []);

    const toggleTheme = () => {
        const root = document.documentElement;
        const newIsDark = !isDark;
        setIsDark(newIsDark);

        if (newIsDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Sun className="h-4 w-4" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
            {isDark ? (
                <Sun className="h-4 w-4 transition-transform hover:rotate-45" />
            ) : (
                <Moon className="h-4 w-4 transition-transform hover:-rotate-12" />
            )}
        </Button>
    );
}

"use client";

import { useToast } from '@/hooks/use-toast';
import { useCallback } from 'react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastOptions {
    title: string;
    description?: string;
    duration?: number;
}

export function useToastNotifications() {
    const { toast } = useToast();

    const showToast = useCallback((type: ToastType, options: ToastOptions) => {
        const variantMap = {
            success: 'default' as const,
            error: 'destructive' as const,
            warning: 'default' as const,
            info: 'default' as const,
        };

        const iconMap = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
        };

        toast({
            variant: variantMap[type],
            title: `${iconMap[type]} ${options.title}`,
            description: options.description,
            duration: options.duration || 5000,
        });
    }, [toast]);

    const success = useCallback((title: string, description?: string) => {
        showToast('success', { title, description });
    }, [showToast]);

    const error = useCallback((title: string, description?: string) => {
        showToast('error', { title, description });
    }, [showToast]);

    const warning = useCallback((title: string, description?: string) => {
        showToast('warning', { title, description });
    }, [showToast]);

    const info = useCallback((title: string, description?: string) => {
        showToast('info', { title, description });
    }, [showToast]);

    // Convenience methods for common actions
    const saved = useCallback(() => {
        success('Saved', 'Your changes have been saved successfully.');
    }, [success]);

    const deleted = useCallback((item = 'Item') => {
        success('Deleted', `${item} has been removed.`);
    }, [success]);

    const copied = useCallback(() => {
        success('Copied', 'Copied to clipboard.');
    }, [success]);

    const submitted = useCallback((item = 'Form') => {
        success('Submitted', `${item} has been submitted successfully.`);
    }, [success]);

    const networkError = useCallback(() => {
        error('Connection Error', 'Please check your internet connection and try again.');
    }, [error]);

    const serverError = useCallback(() => {
        error('Server Error', 'Something went wrong. Please try again later.');
    }, [error]);

    const unauthorized = useCallback(() => {
        error('Unauthorized', 'You do not have permission to perform this action.');
    }, [error]);

    const sessionExpired = useCallback(() => {
        warning('Session Expired', 'Please sign in again to continue.');
    }, [warning]);

    return {
        success,
        error,
        warning,
        info,
        // Convenience methods
        saved,
        deleted,
        copied,
        submitted,
        networkError,
        serverError,
        unauthorized,
        sessionExpired,
    };
}

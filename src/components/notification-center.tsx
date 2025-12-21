"use client";

import { useState, useEffect } from 'react';
import {
    Bell,
    BellOff,
    Check,
    X,
    Calendar,
    Banknote,
    AlertCircle,
    CheckCircle,
    Clock,
    User,
    Briefcase,
    Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: 'success' | 'warning' | 'info' | 'error';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionUrl?: string;
    actionLabel?: string;
}

interface NotificationCenterProps {
    userId?: string;
    userRole?: 'employer' | 'professional' | 'superadmin';
    notifications?: Notification[];
    onMarkAsRead?: (id: string) => void;
    onMarkAllRead?: () => void;
    onClear?: (id: string) => void;
}

// Role-specific demo notifications
const getDefaultNotifications = (userRole?: string): Notification[] => {
    if (userRole === 'employer') {
        return [
            {
                id: '1',
                type: 'success',
                title: 'Application Received',
                message: 'Sarah Kimani (RN) has applied for your Lab Tech stint at your facility.',
                timestamp: new Date(Date.now() - 1000 * 60 * 5),
                read: false,
                actionUrl: '/dashboard/employer',
                actionLabel: 'Review Application',
            },
            {
                id: '2',
                type: 'info',
                title: 'Stint Starting Soon',
                message: 'Your RN stint starts in 2 hours. The professional has confirmed attendance.',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                read: false,
            },
            {
                id: '3',
                type: 'warning',
                title: 'Invoice Due',
                message: 'You have an unpaid invoice (INV-2024-089) due in 3 days.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                read: true,
                actionUrl: '/dashboard/employer',
                actionLabel: 'Pay Now',
            },
            {
                id: '4',
                type: 'success',
                title: 'Stint Completed',
                message: 'Lab Tech stint has been completed successfully. Please rate the professional.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                read: true,
            },
        ];
    } else if (userRole === 'professional') {
        return [
            {
                id: '1',
                type: 'success',
                title: 'Application Accepted',
                message: 'Your application for RN position at Rusinga Nursing Home has been accepted!',
                timestamp: new Date(Date.now() - 1000 * 60 * 5),
                read: false,
                actionUrl: '/dashboard/professional',
                actionLabel: 'View Details',
            },
            {
                id: '2',
                type: 'info',
                title: 'New Stint Match',
                message: 'A new Clinical Officer stint matching your profile is available in Nairobi.',
                timestamp: new Date(Date.now() - 1000 * 60 * 30),
                read: false,
            },
            {
                id: '3',
                type: 'warning',
                title: 'License Expiring Soon',
                message: 'Your nursing license expires in 30 days. Please upload updated documents.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
                read: true,
            },
            {
                id: '4',
                type: 'success',
                title: 'Payment Received',
                message: 'KES 5,500 has been sent to your M-Pesa account for stint #ST-2024-089.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
                read: true,
            },
        ];
    } else if (userRole === 'superadmin') {
        return [
            {
                id: '1',
                type: 'warning',
                title: 'Dispute Raised',
                message: 'A new dispute has been raised for stint #ST-2024-102. Review required.',
                timestamp: new Date(Date.now() - 1000 * 60 * 10),
                read: false,
                actionUrl: '/dashboard/superadmin',
                actionLabel: 'Review Dispute',
            },
            {
                id: '2',
                type: 'info',
                title: 'New Employer Registration',
                message: 'City Hospital has registered and is pending approval.',
                timestamp: new Date(Date.now() - 1000 * 60 * 45),
                read: false,
            },
            {
                id: '3',
                type: 'success',
                title: 'Weekly Report Ready',
                message: 'The weekly platform analytics report is ready for review.',
                timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3),
                read: true,
            },
        ];
    }
    // Guest or unknown role - show empty
    return [];
};

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'success':
            return <CheckCircle className="h-5 w-5 text-green-500" />;
        case 'warning':
            return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        case 'error':
            return <AlertCircle className="h-5 w-5 text-red-500" />;
        default:
            return <Bell className="h-5 w-5 text-blue-500" />;
    }
};

const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
};

export function NotificationCenter({
    userId,
    userRole,
    notifications: propNotifications,
    onMarkAsRead,
    onMarkAllRead,
    onClear
}: NotificationCenterProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    // Initialize notifications based on role
    useEffect(() => {
        if (propNotifications) {
            setNotifications(propNotifications);
        } else {
            setNotifications(getDefaultNotifications(userRole));
        }
    }, [propNotifications, userRole]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const handleMarkAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        onMarkAsRead?.(id);
    };

    const handleMarkAllRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        onMarkAllRead?.();
    };

    const handleClear = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        onClear?.(id);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-accent animate-pulse"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[380px] p-0" align="end">
                {/* Header */}
                <div className="flex items-center justify-between border-b px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                            <Badge variant="secondary" className="text-xs">
                                {unreadCount} new
                            </Badge>
                        )}
                    </div>
                    <div className="flex gap-1">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7"
                                onClick={handleMarkAllRead}
                            >
                                Mark all read
                            </Button>
                        )}
                    </div>
                </div>

                {/* Notification List */}
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <BellOff className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">No notifications</p>
                            <p className="text-sm">You're all caught up!</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-muted/50 transition-colors relative group",
                                        !notification.read && "bg-accent/5"
                                    )}
                                    onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                                >
                                    <div className="flex gap-3">
                                        <div className="shrink-0 mt-0.5">
                                            {getNotificationIcon(notification.type)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm",
                                                    !notification.read && "font-semibold"
                                                )}>
                                                    {notification.title}
                                                </p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleClear(notification.id);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                                                {notification.message}
                                            </p>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimeAgo(notification.timestamp)}
                                                </span>
                                                {notification.actionUrl && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs text-accent"
                                                        asChild
                                                    >
                                                        <a href={notification.actionUrl}>
                                                            {notification.actionLabel || 'View'}
                                                        </a>
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {/* Unread indicator */}
                                    {!notification.read && (
                                        <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-accent" />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer */}
                <div className="border-t p-2">
                    <Button variant="ghost" className="w-full text-sm" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Notification Settings
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

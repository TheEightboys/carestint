"use client";

import { useState, useEffect } from 'react';
import { Bell, X, Check, AlertTriangle, Clock, UserCheck, Briefcase, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: 'pending_review' | 'license_expiring' | 'dispute' | 'payout' | 'new_registration';
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    entityId?: string;
    entityType?: string;
    priority: 'low' | 'medium' | 'high';
}

const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'pending_review',
        title: 'New Professional Registration',
        message: 'Jane Mwangi (RN) has submitted documents for verification.',
        timestamp: new Date(Date.now() - 5 * 60000),
        read: false,
        entityId: 'pro123',
        entityType: 'professional',
        priority: 'medium'
    },
    {
        id: '2',
        type: 'license_expiring',
        title: 'License Expiring Soon',
        message: 'Nairobi Medical Center license expires in 7 days.',
        timestamp: new Date(Date.now() - 30 * 60000),
        read: false,
        entityId: 'emp456',
        entityType: 'employer',
        priority: 'high'
    },
    {
        id: '3',
        type: 'dispute',
        title: 'New Dispute Opened',
        message: 'Professional reported no-show by Mombasa Clinic.',
        timestamp: new Date(Date.now() - 2 * 3600000),
        read: true,
        entityId: 'disp789',
        entityType: 'dispute',
        priority: 'high'
    },
    {
        id: '4',
        type: 'new_registration',
        title: 'New Employer Registration',
        message: 'Kisumu Health Center has completed onboarding.',
        timestamp: new Date(Date.now() - 4 * 3600000),
        read: true,
        entityId: 'emp101',
        entityType: 'employer',
        priority: 'low'
    },
    {
        id: '5',
        type: 'payout',
        title: 'Payout Failed',
        message: 'M-Pesa payout to James Ochieng failed. Retry needed.',
        timestamp: new Date(Date.now() - 6 * 3600000),
        read: false,
        entityId: 'pay202',
        entityType: 'payout',
        priority: 'high'
    }
];

const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
        case 'pending_review':
            return UserCheck;
        case 'license_expiring':
            return Clock;
        case 'dispute':
            return AlertTriangle;
        case 'payout':
            return Banknote;
        case 'new_registration':
            return Briefcase;
        default:
            return Bell;
    }
};

const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
        case 'high':
            return 'text-destructive';
        case 'medium':
            return 'text-yellow-500';
        default:
            return 'text-muted-foreground';
    }
};

const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
};

interface NotificationsPanelProps {
    variant?: 'button' | 'card';
}

export function NotificationsPanel({ variant = 'button' }: NotificationsPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [isOpen, setIsOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const dismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    if (variant === 'card') {
        return (
            <div className="space-y-3">
                {notifications.slice(0, 5).map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                        <div
                            key={notification.id}
                            className={cn(
                                "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                                !notification.read && "bg-accent/5 border-accent/20"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-lg",
                                notification.priority === 'high' ? 'bg-destructive/10' : 'bg-secondary'
                            )}>
                                <Icon className={cn("h-4 w-4", getPriorityColor(notification.priority))} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{notification.title}</p>
                                <p className="text-xs text-muted-foreground truncate">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(notification.timestamp)}</p>
                            </div>
                            {!notification.read && (
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => markAsRead(notification.id)}>
                                    <Check className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <div className="flex items-center justify-between">
                        <SheetTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </SheetTitle>
                        {unreadCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                                Mark all read
                            </Button>
                        )}
                    </div>
                    <SheetDescription>
                        Stay updated on platform activity and pending actions.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="h-[calc(100vh-150px)] mt-4">
                    <div className="space-y-3 pr-4">
                        {notifications.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                <p>No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => {
                                const Icon = getNotificationIcon(notification.type);
                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "flex items-start gap-3 p-4 rounded-lg border transition-all hover:bg-accent/5",
                                            !notification.read && "bg-accent/5 border-accent/20"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-lg shrink-0",
                                            notification.priority === 'high'
                                                ? 'bg-destructive/10'
                                                : notification.priority === 'medium'
                                                    ? 'bg-yellow-500/10'
                                                    : 'bg-secondary'
                                        )}>
                                            <Icon className={cn("h-5 w-5", getPriorityColor(notification.priority))} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-medium">{notification.title}</p>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 shrink-0"
                                                    onClick={() => dismissNotification(notification.id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatTimeAgo(notification.timestamp)}
                                                </span>
                                                {!notification.read && (
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        className="h-auto p-0 text-xs"
                                                        onClick={() => markAsRead(notification.id)}
                                                    >
                                                        Mark as read
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

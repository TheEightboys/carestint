"use client";

import { cn } from '@/lib/utils';

export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-muted",
                className
            )}
            {...props}
        />
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-3 w-1/4" />
        </div>
    );
}

export function StatCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-2 w-16" />
        </div>
    );
}

export function TableRowSkeleton() {
    return (
        <div className="flex items-center gap-4 p-4 border-b">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
        </div>
    );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-lg border">
            <div className="p-4 border-b bg-muted/50">
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                </div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <TableRowSkeleton key={i} />
            ))}
        </div>
    );
}

export function ProfileSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-8 w-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function StintCardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="flex gap-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-20" />
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <StatCardSkeleton key={i} />
                ))}
            </div>

            {/* Content Area */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <div className="lg:col-span-4">
                    <CardSkeleton />
                </div>
                <div className="lg:col-span-3 space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <StintCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        </div>
    );
}

export function NotificationSkeleton() {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg border">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-1/4" />
            </div>
        </div>
    );
}

export function ChartSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

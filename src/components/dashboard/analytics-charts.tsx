"use client";

import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Users,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Activity
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { cn } from '@/lib/utils';

// Stats Card Component
interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon: React.ReactNode;
    trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ title, value, change, changeLabel, icon, trend = 'neutral' }: StatCardProps) {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">{title}</p>
                        <p className="text-3xl font-bold">{value}</p>
                        {change !== undefined && (
                            <div className={cn(
                                "flex items-center gap-1 text-sm",
                                trend === 'up' && "text-green-600",
                                trend === 'down' && "text-red-600",
                                trend === 'neutral' && "text-muted-foreground"
                            )}>
                                {trend === 'up' && <TrendingUp className="h-4 w-4" />}
                                {trend === 'down' && <TrendingDown className="h-4 w-4" />}
                                <span>{change > 0 ? '+' : ''}{change}%</span>
                                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
                            </div>
                        )}
                    </div>
                    <div className="rounded-lg bg-accent/10 p-3 text-accent">
                        {icon}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Earnings Chart Component
interface EarningsChartProps {
    data: Array<{ name: string; earnings: number; payouts?: number }>;
    title?: string;
    description?: string;
}

export function EarningsChart({ data, title = "Earnings Overview", description }: EarningsChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-accent" />
                    {title}
                </CardTitle>
                {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
                            <defs>
                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000)}k`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [`KES ${value.toLocaleString()}`, 'Earnings']}
                            />
                            <Area
                                type="monotone"
                                dataKey="earnings"
                                stroke="hsl(var(--accent))"
                                fillOpacity={1}
                                fill="url(#colorEarnings)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Stints Summary Chart
interface StintsSummaryProps {
    completed: number;
    inProgress: number;
    cancelled: number;
    disputed: number;
}

export function StintsSummaryChart({ completed, inProgress, cancelled, disputed }: StintsSummaryProps) {
    const data = [
        { name: 'Completed', value: completed, color: '#22c55e' },
        { name: 'In Progress', value: inProgress, color: '#3b82f6' },
        { name: 'Cancelled', value: cancelled, color: '#f97316' },
        { name: 'Disputed', value: disputed, color: '#ef4444' },
    ].filter(d => d.value > 0);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-accent" />
                    Stints Summary
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4 text-center text-sm">
                    <div>
                        <p className="text-2xl font-bold text-green-500">{completed}</p>
                        <p className="text-muted-foreground">Completed</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-blue-500">{inProgress}</p>
                        <p className="text-muted-foreground">In Progress</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Fill Rate Chart
interface FillRateChartProps {
    data: Array<{ name: string; fillRate: number; posted: number }>;
}

export function FillRateChart({ data }: FillRateChartProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-accent" />
                    Fill Rate Trends
                </CardTitle>
                <CardDescription>Percentage of stints filled over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" tickFormatter={(value) => `${value}%`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [`${value}%`, 'Fill Rate']}
                            />
                            <Bar
                                dataKey="fillRate"
                                fill="hsl(var(--accent))"
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

// Quick Stats Row
interface QuickStatsProps {
    stats: Array<{
        label: string;
        value: string | number;
        icon: React.ReactNode;
        color?: string;
    }>;
}

export function QuickStats({ stats }: QuickStatsProps) {
    return (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {stats.map((stat, idx) => (
                <Card key={idx} className="p-4">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "rounded-lg p-2",
                            stat.color || "bg-accent/10 text-accent"
                        )}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{stat.value}</p>
                            <p className="text-xs text-muted-foreground">{stat.label}</p>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

// Revenue Trend Line
interface RevenueTrendProps {
    data: Array<{ name: string; revenue: number; fees: number }>;
}

export function RevenueTrend({ data }: RevenueTrendProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Revenue & Fees</CardTitle>
                <CardDescription>Platform revenue and collected fees</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-xs" />
                            <YAxis className="text-xs" tickFormatter={(value) => `${(value / 1000)}k`} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'hsl(var(--background))',
                                    border: '1px solid hsl(var(--border))',
                                    borderRadius: '8px',
                                }}
                                formatter={(value: number) => [`KES ${value.toLocaleString()}`]}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="hsl(var(--accent))"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                name="Revenue"
                            />
                            <Line
                                type="monotone"
                                dataKey="fees"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                                name="Fees Collected"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}

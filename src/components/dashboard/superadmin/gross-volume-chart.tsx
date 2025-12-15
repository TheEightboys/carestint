"use client"

import { useState, useEffect, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { Loader2, BarChart3 } from "lucide-react"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { getAllStints } from "@/lib/firebase/firestore"

const chartConfig = {
  volume: {
    label: "Volume (KES)",
    color: "hsl(var(--accent))",
  },
}

interface GrossVolumeChartProps {
  startDate?: Date;
  endDate?: Date;
}

export function GrossVolumeChart({ startDate, endDate }: GrossVolumeChartProps) {
  const [stints, setStints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Default to last 6 months if no dates provided
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 5);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;

  useEffect(() => {
    const fetchStints = async () => {
      try {
        const data = await getAllStints();
        setStints(data || []);
      } catch (error) {
        console.error("Error fetching stints for chart:", error);
        setStints([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStints();
  }, []);

  // Calculate chart data from real stints
  const chartData = useMemo(() => {
    if (!stints || stints.length === 0) return [];

    // Filter stints that have completed status and fall within date range
    const completedStatuses = ['completed', 'closed', 'settled'];
    const filteredStints = stints.filter(stint => {
      if (!completedStatuses.includes(stint.status)) return false;

      // Get stint date
      let stintDate: Date;
      if (stint.completedAt?.toDate) {
        stintDate = stint.completedAt.toDate();
      } else if (stint.shiftDate?.toDate) {
        stintDate = stint.shiftDate.toDate();
      } else if (stint.createdAt?.toDate) {
        stintDate = stint.createdAt.toDate();
      } else {
        return false;
      }

      return stintDate >= effectiveStartDate && stintDate <= effectiveEndDate;
    });

    // Group by month
    const monthlyData: { [key: string]: number } = {};

    // Initialize all months in range with 0
    const current = new Date(effectiveStartDate);
    current.setDate(1);
    while (current <= effectiveEndDate) {
      const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[key] = 0;
      current.setMonth(current.getMonth() + 1);
    }

    // Sum volumes
    filteredStints.forEach(stint => {
      let stintDate: Date;
      if (stint.completedAt?.toDate) {
        stintDate = stint.completedAt.toDate();
      } else if (stint.shiftDate?.toDate) {
        stintDate = stint.shiftDate.toDate();
      } else if (stint.createdAt?.toDate) {
        stintDate = stint.createdAt.toDate();
      } else {
        return;
      }

      const key = `${stintDate.getFullYear()}-${String(stintDate.getMonth() + 1).padStart(2, '0')}`;
      const amount = stint.offeredRate || stint.totalAmount || 0;

      if (monthlyData[key] !== undefined) {
        monthlyData[key] += amount;
      }
    });

    // Convert to array format for chart
    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, volume]) => {
        const [year, month] = key.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        const monthName = date.toLocaleString('default', { month: 'short' });
        return {
          month: `${monthName} '${year.slice(2)}`,
          volume,
        };
      });
  }, [stints, effectiveStartDate.getTime(), effectiveEndDate.getTime()]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show empty state if no data
  if (chartData.length === 0 || chartData.every(d => d.volume === 0)) {
    return (
      <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
        <BarChart3 className="h-12 w-12 mb-3 opacity-30" />
        <p className="text-sm font-medium">No transaction data yet</p>
        <p className="text-xs">Complete some stints to see volume data here</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `KES ${(value / 1000).toFixed(0)}k`}
        />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent indicator="dot" />}
        />
        <Bar dataKey="volume" fill="var(--color-volume)" radius={4} />
      </BarChart>
    </ChartContainer>
  )
}

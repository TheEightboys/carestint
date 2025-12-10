"use client"

import { useState, useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

// Generate sample data for a date range
const generateChartData = (startDate: Date, endDate: Date) => {
  const data: { month: string; volume: number }[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const monthName = current.toLocaleString('default', { month: 'long', year: 'numeric' });
    // Generate random volume data (in production this would come from Firestore)
    const volume = Math.floor(Math.random() * 50000) + 10000;
    data.push({ month: monthName, volume });
    current.setMonth(current.getMonth() + 1);
  }

  return data;
};

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
  // Default to last 6 months if no dates provided
  const defaultEndDate = new Date();
  const defaultStartDate = new Date();
  defaultStartDate.setMonth(defaultStartDate.getMonth() - 5);

  const effectiveStartDate = startDate || defaultStartDate;
  const effectiveEndDate = endDate || defaultEndDate;

  const chartData = useMemo(() =>
    generateChartData(effectiveStartDate, effectiveEndDate),
    [effectiveStartDate.getTime(), effectiveEndDate.getTime()]
  );

  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => {
            const parts = value.split(' ');
            return parts[0].slice(0, 3) + (parts[1] ? ` '${parts[1].slice(2)}` : '');
          }}
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

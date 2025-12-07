"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { month: "January", volume: 1860 },
  { month: "February", volume: 3050 },
  { month: "March", volume: 2370 },
  { month: "April", volume: 730 },
  { month: "May", volume: 2090 },
  { month: "June", volume: 2140 },
]

const chartConfig = {
  volume: {
    label: "Volume",
    color: "hsl(var(--accent))",
  },
}

export function GrossVolumeChart() {
  return (
    <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="month"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <YAxis
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value / 1000}k`}
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

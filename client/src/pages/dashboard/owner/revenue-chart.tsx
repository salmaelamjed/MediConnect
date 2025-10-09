"use client"

import { Card } from "@/components/ui/card"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { month: "Jan", revenue: 38500 },
  { month: "Fév", revenue: 42300 },
  { month: "Mar", revenue: 39800 },
  { month: "Avr", revenue: 44200 },
  { month: "Mai", revenue: 41900 },
  { month: "Juin", revenue: 45280 },
]

const chartConfig = {
  revenue: {
    label: "Revenus",
    color: "hsl(var(--primary))",
  },
}

export function RevenueChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Revenus Mensuels</h3>
          <p className="mt-1 text-sm text-muted-foreground">Performance financière sur 6 mois</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-semibold text-foreground">€45,280</p>
          <p className="text-xs text-muted-foreground">Ce mois</p>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `€${value / 1000}k`}
            />
            <ChartTooltip content={<ChartTooltipContent />} formatter={(value) => `€${value.toLocaleString()}`} />
            <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  )
}

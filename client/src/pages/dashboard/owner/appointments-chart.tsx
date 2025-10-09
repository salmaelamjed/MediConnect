"use client"

import { Card } from "@/components/ui/card"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { day: "Lun", appointments: 28, completed: 26 },
  { day: "Mar", appointments: 32, completed: 30 },
  { day: "Mer", appointments: 24, completed: 22 },
  { day: "Jeu", appointments: 35, completed: 33 },
  { day: "Ven", appointments: 29, completed: 28 },
  { day: "Sam", appointments: 18, completed: 17 },
  { day: "Dim", appointments: 0, completed: 0 },
]

const chartConfig = {
  appointments: {
    label: "Rendez-vous",
    color: "hsl(var(--chart-1))",
  },
  completed: {
    label: "Complétés",
    color: "hsl(var(--chart-2))",
  },
}

export function AppointmentsChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Rendez-vous de la Semaine</h3>
          <p className="mt-1 text-sm text-muted-foreground">Vue d'ensemble des consultations</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-1" />
            <span className="text-muted-foreground">Prévus</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-chart-2" />
            <span className="text-muted-foreground">Complétés</span>
          </div>
        </div>
      </div>

      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey="appointments"
              stroke="hsl(var(--chart-1))"
              fill="hsl(var(--chart-1))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="completed"
              stroke="hsl(var(--chart-2))"
              fill="hsl(var(--chart-2))"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  )
}

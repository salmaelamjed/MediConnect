"use client"

import { Card } from "@/components/ui/card"
import { Pie, PieChart, Cell, ResponsiveContainer, Legend } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { name: "Consultation Générale", value: 45, color: "hsl(var(--chart-1))" },
  { name: "Suivi", value: 30, color: "hsl(var(--chart-2))" },
  { name: "Urgence", value: 15, color: "hsl(var(--chart-3))" },
  { name: "Vaccination", value: 10, color: "hsl(var(--chart-4))" },
]

const chartConfig = {
  value: {
    label: "Patients",
  },
}

export function PatientStatsChart() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Types de Consultations</h3>
        <p className="mt-1 text-sm text-muted-foreground">Répartition des visites ce mois</p>
      </div>

      <ChartContainer config={chartConfig} className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value, entry: any) => (
                <span className="text-sm text-foreground">
                  {value} ({entry.payload.value}%)
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartContainer>
    </Card>
  )
}

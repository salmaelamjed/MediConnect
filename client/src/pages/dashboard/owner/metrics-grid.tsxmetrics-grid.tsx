import { Card } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Users, Calendar, DollarSign, Activity } from "lucide-react"

const metrics = [
  {
    title: "Revenus du Mois",
    value: "€45,280",
    change: "+12.5%",
    trend: "up",
    icon: DollarSign,
  },
  {
    title: "Patients Actifs",
    value: "1,247",
    change: "+8.2%",
    trend: "up",
    icon: Users,
  },
  {
    title: "Rendez-vous Aujourd'hui",
    value: "24",
    change: "-2 annulés",
    trend: "down",
    icon: Calendar,
  },
  {
    title: "Taux d'Occupation",
    value: "87%",
    change: "+5.3%",
    trend: "up",
    icon: Activity,
  },
]

export function MetricsGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon
        const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown

        return (
          <Card key={metric.title} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{metric.title}</p>
                <p className="mt-2 text-3xl font-semibold text-foreground">{metric.value}</p>
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon className={`h-3 w-3 ${metric.trend === "up" ? "text-accent" : "text-destructive"}`} />
                  <span className={`text-xs font-medium ${metric.trend === "up" ? "text-accent" : "text-destructive"}`}>
                    {metric.change}
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}

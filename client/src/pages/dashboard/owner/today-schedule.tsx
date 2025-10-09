import { Card } from "@/components/ui/card"
import { Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const appointments = [
  {
    time: "09:00",
    patient: "Pierre Durand",
    type: "Consultation",
    status: "completed",
  },
  {
    time: "09:30",
    patient: "Marie Lambert",
    type: "Suivi",
    status: "completed",
  },
  {
    time: "10:00",
    patient: "Jacques Moreau",
    type: "Urgence",
    status: "in-progress",
  },
  {
    time: "10:30",
    patient: "Anne Rousseau",
    type: "Consultation",
    status: "upcoming",
  },
  {
    time: "11:00",
    patient: "Paul Bernard",
    type: "Vaccination",
    status: "upcoming",
  },
]

export function TodaySchedule() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Agenda du Jour</h3>
        <p className="mt-1 text-sm text-muted-foreground">Vos prochains rendez-vous</p>
      </div>

      <div className="space-y-3">
        {appointments.map((apt, index) => (
          <div
            key={index}
            className={`p-3 rounded-lg border transition-colors ${
              apt.status === "in-progress"
                ? "border-primary bg-primary/5"
                : apt.status === "completed"
                  ? "border-border bg-muted/30 opacity-60"
                  : "border-border hover:bg-accent/5"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{apt.time}</span>
              </div>
              <Badge
                variant={
                  apt.status === "completed" ? "secondary" : apt.status === "in-progress" ? "default" : "outline"
                }
                className="text-xs"
              >
                {apt.status === "completed" ? "Terminé" : apt.status === "in-progress" ? "En cours" : "À venir"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 ml-6">
              <User className="w-3 h-3 text-muted-foreground" />
              <span className="text-sm text-foreground">{apt.patient}</span>
              <span className="text-xs text-muted-foreground">• {apt.type}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const staff = [
  {
    name: "Dr. Marie Dubois",
    role: "Médecin Généraliste",
    status: "En consultation",
    patients: 8,
    initials: "MD",
  },
  {
    name: "Dr. Jean Martin",
    role: "Médecin Généraliste",
    status: "Disponible",
    patients: 6,
    initials: "JM",
  },
  {
    name: "Sophie Laurent",
    role: "Infirmière",
    status: "En consultation",
    patients: 4,
    initials: "SL",
  },
  {
    name: "Claire Petit",
    role: "Secrétaire Médicale",
    status: "Disponible",
    patients: 0,
    initials: "CP",
  },
]

export function StaffOverview() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Équipe Médicale</h3>
        <p className="mt-1 text-sm text-muted-foreground">Statut du personnel aujourd'hui</p>
      </div>

      <div className="space-y-4">
        {staff.map((member) => (
          <div
            key={member.name}
            className="flex items-center justify-between p-3 transition-colors border rounded-lg border-border hover:bg-accent/5"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">{member.initials}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.role}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {member.patients > 0 && <span className="text-sm text-muted-foreground">{member.patients} patients</span>}
              <Badge variant={member.status === "Disponible" ? "secondary" : "default"} className="text-xs">
                {member.status}
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

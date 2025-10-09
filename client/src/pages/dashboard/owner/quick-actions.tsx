import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Users, Calendar } from "lucide-react"

const actions = [
  {
    label: "Nouveau Patient",
    icon: Plus,
    variant: "default" as const,
  },
  {
    label: "Créer Ordonnance",
    icon: FileText,
    variant: "outline" as const,
  },
  {
    label: "Gérer Personnel",
    icon: Users,
    variant: "outline" as const,
  },
  {
    label: "Voir Agenda",
    icon: Calendar,
    variant: "outline" as const,
  },
]

export function QuickActions() {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground">Actions Rapides</h3>
        <p className="mt-1 text-sm text-muted-foreground">Accès direct aux fonctions principales</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button key={action.label} variant={action.variant} className="flex-col h-auto gap-2 py-4">
              <Icon className="w-5 h-5" />
              <span className="text-xs leading-tight text-center text-balance">{action.label}</span>
            </Button>
          )
        })}
      </div>
    </Card>
  )
}

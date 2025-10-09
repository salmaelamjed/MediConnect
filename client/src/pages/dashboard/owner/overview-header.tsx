import { Calendar, Bell, Settings, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function OverviewHeader() {
  const currentDate = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <header className="border-b border-border bg-card">
      <div className="container px-4 py-4 mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tableau de Bord - Cabinet Médical</h1>
            <p className="mt-1 text-sm capitalize text-muted-foreground">{currentDate}</p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon">
              <Calendar className="w-4 h-4" />
            </Button>

            <Button variant="outline" size="icon" className="relative bg-transparent">
              <Bell className="w-4 h-4" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </Button>

            <Button variant="outline" size="icon">
              <Settings className="w-4 h-4" />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <User className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Dr. Marie Dubois</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Propriétaire & Médecin</DropdownMenuItem>
                <DropdownMenuItem>Mon Profil</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Déconnexion</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  )
}

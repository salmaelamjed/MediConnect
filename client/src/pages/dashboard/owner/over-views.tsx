import { AppointmentsChart } from "./appointments-chart"
import { RevenueChart } from "./revenue-chart"
import { PatientStatsChart } from "./patient-stats-chart"
import { StaffOverview } from "./staff-overview"
import { TodaySchedule } from "./today-schedule"
import { QuickActions } from "./quick-actions"
import { MetricsGrid } from "./metrics-grid.tsxmetrics-grid"

export default function OwnerOverview() {
  return (
    <div className="min-h-screen bg-background">

      <main className="container px-4 py-6 mx-auto space-y-6">
        <MetricsGrid />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <AppointmentsChart />
            <RevenueChart />
          </div>

          <div className="space-y-6">
            <TodaySchedule />
            <QuickActions />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PatientStatsChart />
          <StaffOverview />
        </div>
      </main>
    </div>
  )
}

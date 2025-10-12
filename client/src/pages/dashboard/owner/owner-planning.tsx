"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, ChevronRight, Plus, Calendar, Loader2, AlertCircle, Phone, Mail, MapPin } from "lucide-react"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { fetchDoctorPlanning, type DoctorPlanningResponseData } from "@/store/planning/act/fetchDoctorPlanning"
import {
  format,
  parse,
  addMinutes,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addDays,
  subDays,
  isSameMonth,
  parseISO,
} from "date-fns"
import { fr } from "date-fns/locale"

// Define interfaces for appointment and slot
interface Appointment {
  id: string
  day: string
  date: string
  startTime: string
  endTime: string
  title: string
  color: string
  description: string
  patient?: {
    name: string
    age: number
    gender: string
  }
  status: string
}

interface Slot {
  time: string
  time_display: string
  status: string
  reservation: {
    id: number
    status: string
    reason: string
    doctor_notes: string | null
    is_follow_up: boolean
  } | null
  patient: {
    name: string
    date_of_birth: string
    age: number
    gender: string
  } | null
}

const avatarColors = [
  "bg-orange-100 text-orange-600",
  "bg-pink-100 text-pink-600",
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-teal-100 text-teal-600",
  "bg-green-100 text-green-600",
]

// Helper to get consistent avatar color for a patient
const getAvatarColor = (name: string): string => {
  const index = name.charCodeAt(0) % avatarColors.length
  return avatarColors[index]
}

// Helper to generate time slots dynamically based on the earliest slot in the planning data
const generateTimeSlots = (planning: DoctorPlanningResponseData["planning"], selectedDate: string, viewMode: "day" | "week" | "month"): string[] => {
  const slots: string[] = []
  let startHour = 10 // Default start time (10:00)
  let endHour = 15 // Default end time (15:00)

  // Find the earliest and latest slot times for the selected date or period
  if (planning && viewMode === "day") {
    const dayData = planning[selectedDate] as { slots: Slot[] } | undefined
    if (dayData?.slots?.length) {
      const times = dayData.slots.map(slot => slot.time_display)
      if (times.length) {
        const earliest = times.reduce((min, time) => (time < min ? time : min), times[0])
        const latest = times.reduce((max, time) => (time > max ? time : max), times[0])
        startHour = parseInt(earliest.split(":")[0])
        endHour = parseInt(latest.split(":")[0]) + 1
      }
    }
  } else if (planning && (viewMode === "week" || viewMode === "month")) {
    const allTimes = Object.entries(planning)
      .filter(([key]) => key !== "_stats")
      .flatMap(([_, dayData]) => (dayData as { slots: Slot[] }).slots?.map(slot => slot.time_display) || [])
    if (allTimes.length) {
      const earliest = allTimes.reduce((min, time) => (time < min ? time : min), allTimes[0])
      const latest = allTimes.reduce((max, time) => (time > max ? time : max), allTimes[0])
      startHour = parseInt(earliest.split(":")[0])
      endHour = parseInt(latest.split(":")[0]) + 1
    }
  }

  // Generate slots from startHour to endHour in 30-minute intervals
  let hour = startHour
  let minute = 0
  while (hour < endHour) {
    const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    slots.push(time)
    minute += 30
    if (minute >= 60) {
      hour += 1
      minute = 0
    }
  }
  return slots
}

// Helper to convert server slots to appointments, including available slots
const convertSlotsToAppointments = (planning: DoctorPlanningResponseData["planning"]): Appointment[] => {
  const appointments: Appointment[] = []

  if (!planning) return appointments

  Object.entries(planning).forEach(([date, dayPlanning]) => {
    if (date === "_stats") return

    const dayData = dayPlanning as DoctorPlanningResponseData["planning"][string] & { slots: Slot[] }
    if (dayData.slots && Array.isArray(dayData.slots)) {
      dayData.slots.forEach((slot: Slot) => {
        const startDateTime = parse(slot.time, "HH:mm:ss", new Date(date))
        const endDateTime = addMinutes(startDateTime, 30)
        const endTime = format(endDateTime, "HH:mm", { locale: fr })

        appointments.push({
          id: `${date}-${slot.time}`,
          day: format(new Date(date), "EEEE", { locale: fr }),
          date,
          startTime: slot.time_display,
          endTime,
          title: slot.reservation?.reason || (slot.status === "available" ? "Available" : "Consultation"),
          color: slot.status === "available" ? "bg-gray-50 border-gray-100" : "bg-white border-gray-100",
          description:
            slot.reservation?.doctor_notes || (slot.status === "available" ? "Available slot" : "No additional notes"),
          status: slot.status,
          patient: slot.patient
            ? {
                name: slot.patient.name,
                age: slot.patient.age,
                gender: slot.patient.gender,
              }
            : undefined,
        })
      })
    }
  })
  return appointments
}

export default function OwnerPlanning() {
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("week")
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null)

  const { plannings, loading, error } = useAppSelector((state) => state.plannings)
  const dispatch = useAppDispatch()

  const [currentDate, setCurrentDate] = useState<Date>(new Date())

  const getDateRange = () => {
    if (viewMode === "day") {
      return {
        startDate: format(currentDate, "yyyy-MM-dd"),
        endDate: format(currentDate, "yyyy-MM-dd"),
      }
    } else if (viewMode === "week") {
      return {
        startDate: format(startOfWeek(currentDate, { locale: fr }), "yyyy-MM-dd"),
        endDate: format(endOfWeek(currentDate, { locale: fr }), "yyyy-MM-dd"),
      }
    } else {
      return {
        startDate: format(startOfMonth(currentDate), "yyyy-MM-dd"),
        endDate: format(endOfMonth(currentDate), "yyyy-MM-dd"),
      }
    }
  }

  const { startDate, endDate } = getDateRange()

  useEffect(() => {
    console.log("Fetching planning with dates:", { startDate, endDate })
    dispatch(fetchDoctorPlanning({ start_date: startDate, end_date: endDate }))
  }, [dispatch, startDate, endDate])

  const planningData = plannings

  console.log("Planning data:", planningData)
  console.log("Loading state:", loading)
  console.log("Error state:", error)

  const weekDays = planningData?.planning
    ? Object.keys(planningData.planning)
        .filter((key) => key !== "_stats")
        .map((date) => ({
          date,
          day: format(new Date(date), "EEEE d", { locale: fr }),
        }))
    : []

  const monthDays = eachDayOfInterval({
    start: new Date(startDate),
    end: new Date(endDate),
  }).map((date) => ({
    date: format(date, "yyyy-MM-dd"),
    day: format(date, "d", { locale: fr }),
    isCurrentMonth: isSameMonth(date, currentDate),
  }))

  const timeSlots = generateTimeSlots(planningData?.planning, format(currentDate, "yyyy-MM-dd"), viewMode)

  const appointments = planningData?.planning ? convertSlotsToAppointments(planningData.planning) : []

  console.log("Converted appointments:", appointments)

  const getAppointmentForSlot = (day: string, time: string) => {
    return appointments.find((apt) => apt.date === day && apt.startTime === time)
  }

  const getAppointmentHeight = (appointment: Appointment) => {
    const start = timeSlots.indexOf(appointment.startTime)
    const end = timeSlots.indexOf(appointment.endTime)
    return end - start > 0 ? end - start : 1
  }

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setIsDetailsSheetOpen(true)
  }

  const handleAddSlotClick = (date: string, time: string) => {
    setSelectedSlot({ date, time })
    setIsAddSheetOpen(true)
  }

  const handleDayClick = (date: string) => {
    setCurrentDate(parseISO(date))
    setViewMode("day")
  }

  const handlePrevious = () => {
    if (viewMode === "day") {
      setCurrentDate(subDays(currentDate, 1))
    } else if (viewMode === "week") {
      setCurrentDate(subDays(currentDate, 7))
    } else {
      setCurrentDate(subDays(currentDate, 30))
    }
  }

  const handleNext = () => {
    if (viewMode === "day") {
      setCurrentDate(addDays(currentDate, 1))
    } else if (viewMode === "week") {
      setCurrentDate(addDays(currentDate, 7))
    } else {
      setCurrentDate(addDays(currentDate, 30))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  if (loading === "pending") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-b-2 border-blue-500 rounded-full animate-spin"></div>
          <p className="font-medium text-gray-600">Loading appointments...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Error Loading Schedule</h2>
          <p className="mb-6 text-gray-600">{error}</p>
          <Button
            onClick={() => dispatch(fetchDoctorPlanning({ start_date: startDate, end_date: endDate }))}
            className="text-white bg-blue-500 hover:bg-blue-600"
          >
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!planningData || !planningData.planning) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 text-center">
          <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h2 className="mb-2 text-xl font-semibold text-gray-900">No Schedule Data</h2>
          <p className="mb-6 text-gray-600">No planning data available for the selected period.</p>
          <Button
            onClick={() => dispatch(fetchDoctorPlanning({ start_date: startDate, end_date: endDate }))}
            className="text-white bg-blue-500 hover:bg-blue-600"
          >
            Load Current Period
          </Button>
        </div>
      </div>
    )
  }

  const currentDay = {
    date: format(currentDate, "yyyy-MM-dd"),
    day: format(currentDate, "EEEE d MMMM yyyy", { locale: fr }),
  }

  const weekDayHeaders = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container px-4 py-6 mx-auto max-w-[1600px]">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Schedule</h1>
              <p className="text-sm text-gray-500">
                {planningData.doctor?.name || "Doctor"} - {planningData.doctor?.speciality || "Specialty"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent w-9 h-9"
                onClick={handlePrevious}
                aria-label="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleToday}>
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="bg-transparent w-9 h-9"
                onClick={handleNext}
                aria-label="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
              <Select value={viewMode} onValueChange={(value: "day" | "week" | "month") => setViewMode(value)}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setIsAddSheetOpen(true)}
                className="gap-2 text-white bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
                New
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden bg-white border border-gray-200 shadow-sm rounded-xl">
            {viewMode === "day" && (
              <div className="overflow-x-auto">
                <div className="min-w-[400px]">
                  <div className="grid grid-cols-[80px_1fr] border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
                    <div className="p-3 text-xs font-medium text-gray-500 border-r border-gray-200"></div>
                    <div className="p-3 text-center border-l border-gray-100">
                      <div className={`text-sm font-semibold ${currentDay.date === format(new Date(), "yyyy-MM-dd") ? "text-blue-600" : "text-gray-900"}`}>
                        {currentDay.day}
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="grid grid-cols-[80px_1fr] border-b border-gray-100 min-h-[80px]"
                      >
                        <div className="flex items-start p-3 text-xs font-medium text-gray-400 bg-white border-r border-gray-200">
                          {time}
                        </div>
                        <div className="relative p-2 bg-white border-l border-gray-100">
                          {(() => {
                            const appointment = getAppointmentForSlot(currentDay.date, time)
                            if (!appointment) return null

                            const height = getAppointmentHeight(appointment)
                            if (appointment.status === "available") {
                              return (
                                <button
                                  onClick={() => handleAddSlotClick(appointment.date, appointment.startTime)}
                                  className="absolute p-3 text-center text-gray-500 transition-all border-2 border-gray-300 border-dashed rounded-lg inset-2 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                  style={{
                                    height: `calc(${height * 80}px - 16px)`,
                                    zIndex: 10,
                                  }}
                                >
                                  <div className="flex items-center justify-center h-full font-medium">
                                    <Plus />
                                  </div>
                                </button>
                              )
                            } else {
                              return (
                                <button
                                  onClick={() => handleAppointmentClick(appointment)}
                                  className={`bg-blue-200 border-l-4 border-l-blue-600 absolute inset-2 rounded-lg  p-3 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm ${appointment.color}`}
                                  style={{
                                    height: `calc(${height * 80}px - 16px)`,
                                    zIndex: 10,
                                  }}
                                >
                                  <div className="flex items-start gap-2">
                                    <Avatar
                                      className={`flex-shrink-0 w-8 h-8 ${getAvatarColor(appointment.patient?.name || "")}`}
                                    >
                                      <AvatarFallback className="text-sm font-semibold">
                                        {appointment.patient?.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")
                                          .toUpperCase()
                                          .slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                        {appointment.patient?.name}
                                      </div>
                                      <div className="mt-1 text-xs font-medium text-teal-600">
                                        {appointment.startTime} - {appointment.endTime}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              )
                            }
                          })()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {viewMode === "week" && (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-200 bg-white sticky top-0 z-20 shadow-sm">
                    <div className="p-3 text-xs font-medium text-gray-500 border-r border-gray-200"></div>
                    {weekDays.map((day) => {
                      const isToday = day.date === format(new Date(), "yyyy-MM-dd")
                      return (
                        <div key={day.date} className="p-3 text-center border-l border-gray-100">
                          <div className={`text-sm font-semibold ${isToday ? "text-blue-600" : "text-gray-900"}`}>
                            {day.day}
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  <div className="relative">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-gray-100 min-h-[80px]"
                      >
                        <div className="flex items-start p-3 text-xs font-medium text-gray-400 bg-white border-r border-gray-200">
                          {time}
                        </div>
                        {weekDays.map((day) => {
                          const appointment = getAppointmentForSlot(day.date, time)
                          return (
                            <div key={`${day.date}-${time}`} className="relative p-2 bg-white border-l border-gray-100">
                              {appointment && (
                                <>
                                  {appointment.status === "available" ? (
                                    <button
                                      onClick={() => handleAddSlotClick(appointment.date, appointment.startTime)}
                                      className="absolute p-3 text-center text-gray-500 transition-all border-2 border-gray-300 border-dashed rounded-lg inset-2 bg-gray-50 hover:border-gray-400 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                      style={{
                                        height: `calc(${getAppointmentHeight(appointment) * 80}px - 16px)`,
                                        zIndex: 10,
                                      }}
                                    >
                                      <div className="flex items-center justify-center h-full font-medium">
                                        <Plus />
                                      </div>
                                    </button>
                                  ) : (
                                    appointment.patient && (
                                      <button
                                        onClick={() => handleAppointmentClick(appointment)}
                                        className={`bg-blue-200 border-l-4 border-l-blue-500 absolute inset-2 rounded-lg  p-3 text-left transition-all hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm ${appointment.color}`}
                                        style={{
                                          height: `calc(${getAppointmentHeight(appointment) * 80}px - 16px)`,
                                          zIndex: 10,
                                        }}
                                      >
                                        <div className="flex items-start gap-2">
                                          <Avatar
                                            className={`flex-shrink-0 w-8 h-8 ${getAvatarColor(appointment.patient.name)}`}
                                          >
                                            <AvatarFallback className="text-sm font-semibold">
                                              {appointment.patient.name
                                                .split(" ")
                                                .map((n) => n[0])
                                                .join("")
                                                .toUpperCase()
                                                .slice(0, 2)}
                                            </AvatarFallback>
                                          </Avatar>
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-gray-900 line-clamp-1">
                                              {appointment.patient.name}
                                            </div>
                                            <div className="mt-1 text-xs font-medium text-teal-600">
                                              {appointment.startTime} - {appointment.endTime}
                                            </div>
                                          </div>
                                        </div>
                                      </button>
                                    )
                                  )}
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {viewMode === "month" && (
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  <div className="sticky top-0 z-20 grid grid-cols-7 bg-white border-b border-gray-200 shadow-sm">
                    {weekDayHeaders.map((header) => (
                      <div key={header} className="p-3 text-sm font-medium text-center text-gray-500 border-l border-gray-100 first:border-l-0">
                        {header}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {monthDays.map((day) => {
                      const dayAppointments = appointments
                        .filter((apt) => apt.date === day.date && apt.status !== "available")
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))

                      return (
                        <button
                          key={day.date}
                          onClick={() => handleDayClick(day.date)}
                          className={` p-2 min-h-[140px] flex flex-col ${day.isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"} hover:bg-gray-100 transition-all`}
                        >
                          <div className="mb-2 text-sm font-medium text-right">
                            {day.day}
                          </div>
                          <div className="flex-1 space-y-1 overflow-y-auto">
                            {dayAppointments.map((apt) => (
                              <div
                                key={apt.id}
                                className="bg-blue-200 border-l-4 border-l-blue-600 w-full p-1.5 text-left rounded-md text-xs border border-gray-100 shadow-sm "
                              >
                                <div className="font-medium text-gray-900">{apt.startTime}</div>
                                <div className="text-gray-600 truncate">{apt.patient?.name || apt.title}</div>
                              </div>
                            ))}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="w-[95vw] sm:w-[500px] overflow-y-auto bg-white p-0">
          {selectedAppointment && (
            <div className="p-6 space-y-6">
              <SheetHeader className="pb-4 border-b border-gray-100">
                <SheetTitle className="text-xl font-bold text-gray-900">{selectedAppointment.title}</SheetTitle>
              </SheetHeader>

              <div className="space-y-6">
                {selectedAppointment.patient && (
                  <div className="p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50">
                    <div className="flex items-start gap-4">
                      <Avatar className={`flex-shrink-0 w-12 h-12 ${getAvatarColor(selectedAppointment.patient.name)}`}>
                        <AvatarFallback className="text-lg font-bold">
                          {selectedAppointment.patient.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()
                            .slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="text-lg font-bold text-gray-900">{selectedAppointment.patient.name}</div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>+123 456 789</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            <span>harry@email.com</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500">Visit Type</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">Clinic Visit</div>
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-500">Gender</div>
                    <div className="mt-1 text-sm font-semibold text-gray-900">
                      {selectedAppointment.patient?.gender || "N/A"}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <Calendar className="w-3 h-3" />
                    Date & Time
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">
                    {format(new Date(selectedAppointment.date), "dd MMM, yyyy HH:mm a", { locale: fr })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
                    <MapPin className="w-3 h-3" />
                    Location
                  </div>
                  <div className="mt-1 text-sm font-semibold text-gray-900">Birmingham</div>
                </div>

                {selectedAppointment.description && (
                  <div>
                    <div className="text-xs font-medium text-gray-500">Notes</div>
                    <div className="mt-1 text-sm text-gray-700">{selectedAppointment.description}</div>
                  </div>
                )}

                <Button className="w-full gap-2 text-white bg-blue-500 hover:bg-blue-600">
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={isAddSheetOpen} onOpenChange={setIsAddSheetOpen}>
        <SheetContent className="w-[95vw] sm:w-[500px] overflow-y-auto bg-white p-0">
          <div className="p-6 space-y-6">
            <SheetHeader className="pb-4 border-b border-gray-100">
              <SheetTitle className="text-xl font-bold text-gray-900">Add New Appointment</SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" placeholder="e.g., General Consultation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    defaultValue={selectedSlot?.date || format(new Date(), "yyyy-MM-dd")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Select defaultValue={selectedSlot?.time || timeSlots[0]}>
                    <SelectTrigger id="time">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>
                          {slot}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Add details..." rows={3} />
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsAddSheetOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => setIsAddSheetOpen(false)}
                  className="text-white bg-blue-500 hover:bg-blue-600"
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Share2,
  Filter,
  Plus,
  Clock,
  Users,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react"

// Sample appointment data
const appointments = [
  {
    id: 1,
    title: "Weekly Team Meeting",
    day: "Mon",
    date: 6,
    startTime: "9:00 AM",
    endTime: "9:30 AM",
    color: "bg-emerald-100 border-emerald-300 text-emerald-900",
    participants: 5,
    yes: 5,
    waiting: 0,
    description:
      "Regular weekly team meeting to discuss ongoing projects, patient care updates, and administrative matters.",
  },
  {
    id: 2,
    title: "Paperwork & Records",
    day: "Tue",
    date: 7,
    startTime: "9:00 AM",
    endTime: "9:30 AM",
    color: "bg-pink-100 border-pink-300 text-pink-900",
    participants: 1,
    yes: 1,
    waiting: 0,
    description: "Time allocated for completing patient records, insurance forms, and administrative paperwork.",
  },
  {
    id: 3,
    title: "Consultation with John Doe",
    day: "Wed",
    date: 8,
    startTime: "9:00 AM",
    endTime: "9:30 AM",
    color: "bg-blue-100 border-blue-300 text-blue-900",
    participants: 2,
    yes: 2,
    waiting: 0,
    description:
      "Follow-up consultation for chronic condition management. Review test results and adjust treatment plan.",
  },
  {
    id: 4,
    title: "Weekly Team Meeting",
    day: "Fri",
    date: 10,
    startTime: "9:00 AM",
    endTime: "9:30 AM",
    color: "bg-emerald-100 border-emerald-300 text-emerald-900",
    participants: 5,
    yes: 5,
    waiting: 0,
    description:
      "Regular weekly team meeting to discuss ongoing projects, patient care updates, and administrative matters.",
  },
  {
    id: 5,
    title: "Medical Conference Call",
    day: "Thur",
    date: 9,
    startTime: "9:30 AM",
    endTime: "10:00 AM",
    color: "bg-purple-100 border-purple-300 text-purple-900",
    participants: 8,
    yes: 7,
    waiting: 1,
    description: "Virtual conference with specialists to discuss complex cases and share medical insights.",
  },
  {
    id: 6,
    title: "Follow-up with Jane Smith",
    day: "Wed",
    date: 8,
    startTime: "10:00 AM",
    endTime: "10:30 AM",
    color: "bg-blue-100 border-blue-300 text-blue-900",
    participants: 2,
    yes: 2,
    waiting: 0,
    description: "Post-surgery follow-up appointment. Check healing progress and discuss recovery plan.",
  },
  {
    id: 7,
    title: "Pediatrics Check-up - Emily Brown",
    day: "Fri",
    date: 10,
    startTime: "10:00 AM",
    endTime: "10:30 AM",
    color: "bg-blue-100 border-blue-300 text-blue-900",
    participants: 3,
    yes: 3,
    waiting: 0,
    description:
      "Routine pediatric check-up including growth measurements, vaccinations, and developmental assessment.",
  },
  {
    id: 8,
    title: "Cardiology Examination - Michael Green",
    day: "Mon",
    date: 6,
    startTime: "11:30 AM",
    endTime: "12:00 PM",
    color: "bg-blue-100 border-blue-300 text-blue-900",
    participants: 2,
    yes: 2,
    waiting: 0,
    description:
      "Comprehensive cardiac examination including ECG, blood pressure monitoring, and cardiovascular assessment.",
  },
  {
    id: 9,
    title: "Surgery Preparation",
    day: "Mon",
    date: 6,
    startTime: "1:30 PM",
    endTime: "3:00 PM",
    color: "bg-amber-100 border-amber-300 text-amber-900",
    participants: 4,
    yes: 4,
    waiting: 0,
    description:
      "Pre-operative preparation and planning session. Review surgical procedures, equipment, and team assignments.",
  },
  {
    id: 10,
    title: "Emergency Case - Robert Wilson",
    day: "Fri",
    date: 10,
    startTime: "1:30 PM",
    endTime: "3:00 PM",
    color: "bg-sky-100 border-sky-300 text-sky-900",
    participants: 7,
    yes: 6,
    waiting: 1,
    description:
      "The patient has arrived with acute chest pain and shortness of breath. Immediate diagnostics are required, including an ECG, blood pressure measurement, and oxygen level check. If symptoms persist, this may indicate a heart attack, hospitalization or emergency medical treatment may be necessary.",
  },
]

const timeSlots = [
  "9:00 AM",
  "9:30 AM",
  "10:00 AM",
  "10:30 AM",
  "11:00 AM",
  "11:30 AM",
  "12:00 PM",
  "12:30 PM",
  "1:00 PM",
  "1:30 PM",
  "2:00 PM",
  "2:30 PM",
  "3:00 PM",
]

const weekDays = [
  { day: "Mon", date: 6 },
  { day: "Tue", date: 7 },
  { day: "Wed", date: 8 },
  { day: "Thur", date: 9 },
  { day: "Fri", date: 10 },
  { day: "Sat", date: 11 },
  { day: "Sun", date: 12 },
]

export default function OwnerPlanning() {
  const [selectedAppointment, setSelectedAppointment] = useState<(typeof appointments)[0] | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  const getAppointmentForSlot = (day: string, time: string) => {
    return appointments.find((apt) => apt.day === day && apt.startTime === time)
  }

  const getAppointmentHeight = (appointment: any) => {
    const start = timeSlots.indexOf(appointment.startTime)
    const end = timeSlots.indexOf(appointment.endTime)
    return end - start
  }

  const handleAppointmentClick = (appointment: (typeof appointments)[0]) => {
    setSelectedAppointment(appointment)
    setIsSheetOpen(true)
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container px-6 py-4 mx-auto">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-foreground">Appointment</h1>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Share2 className="w-4 h-4" />
                Share availability
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  ⌘S
                </kbd>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-6 py-6 mx-auto">
        <div className="">
          {/* Calendar Section */}
          <div className="space-y-4">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-sm font-medium text-muted-foreground">JAN</span>
                    <span className="text-3xl font-semibold text-foreground">10</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    January 2025
                    <span className="ml-2 text-xs">Week 2</span>
                  </div>
                  <div className="text-xs text-muted-foreground">Jan 6, 2025 - Jan 12, 2025</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="bg-transparent h-9 w-9">
                  <Search className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" className="bg-transparent h-9 w-9">
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm">
                  Today
                </Button>
                <Button variant="outline" size="icon" className="bg-transparent h-9 w-9">
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Select defaultValue="week">
                  <SelectTrigger className="w-[130px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day view</SelectItem>
                    <SelectItem value="week">Week view</SelectItem>
                    <SelectItem value="month">Month view</SelectItem>
                  </SelectContent>
                </Select>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add appointment
                      <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-primary-foreground/20 bg-primary-foreground/10 px-1.5 font-mono text-[10px] font-medium">
                        ⌘N
                      </kbd>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Appointment</DialogTitle>
                      <DialogDescription>Create a new appointment for your schedule</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" placeholder="Appointment title" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input id="date" type="date" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Time</Label>
                          <Select>
                            <SelectTrigger id="time">
                              <SelectValue placeholder="Select time" />
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
                        <Label htmlFor="duration">Duration</Label>
                        <Select defaultValue="30">
                          <SelectTrigger id="duration">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 minutes</SelectItem>
                            <SelectItem value="60">1 hour</SelectItem>
                            <SelectItem value="90">1.5 hours</SelectItem>
                            <SelectItem value="120">2 hours</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" placeholder="Add appointment details..." rows={3} />
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={() => setIsAddDialogOpen(false)}>Create Appointment</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Calendar Grid */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                  {/* Week Header */}
                  <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border bg-muted/30">
                    <div className="p-3"></div>
                    {weekDays.map((day) => (
                      <div key={day.date} className="p-3 text-center border-l border-border">
                        <div className="text-sm font-medium text-foreground">
                          {day.day} {day.date}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Time Slots */}
                  <div className="relative">
                    {timeSlots.map((time) => (
                      <div
                        key={time}
                        className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-border min-h-[80px]"
                      >
                        <div className="p-3 text-sm font-medium border-r text-muted-foreground border-border">
                          {time}
                        </div>
                        {weekDays.map((day) => {
                          const appointment = getAppointmentForSlot(day.day, time)
                          const isLunchBreak = time === "12:00 PM" || time === "12:30 PM"

                          return (
                            <div key={`${day.date}-${time}`} className="relative p-1 border-l border-border">
                              {appointment && appointment.startTime === time && (
                                <button
                                  onClick={() => handleAppointmentClick(appointment)}
                                  className={`absolute inset-1 rounded-lg border-2 p-2 text-left transition-all hover:shadow-md ${
                                    appointment.color
                                  } ${
                                    selectedAppointment?.id === appointment.id && isSheetOpen
                                      ? "ring-2 ring-primary ring-offset-2"
                                      : ""
                                  }`}
                                  style={{
                                    height: `calc(${getAppointmentHeight(appointment) * 80}px - 8px)`,
                                    zIndex: 10,
                                  }}
                                >
                                  <div className="text-xs font-semibold line-clamp-2">{appointment.title}</div>
                                  <div className="mt-1 text-xs opacity-80">{appointment.startTime}</div>
                                </button>
                              )}
                              {isLunchBreak && !appointment && (
                                <div className="absolute p-2 text-left border-2 border-orange-200 rounded-lg inset-1 bg-orange-50">
                                  <div className="text-xs font-semibold text-orange-900">Lunch Break</div>
                                  <div className="mt-1 text-xs text-orange-700">{time}</div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Sheet component to display appointment details */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {selectedAppointment && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl">{selectedAppointment.title}</SheetTitle>
                <SheetDescription className="sr-only">Appointment details and information</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Date and Time */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">Friday, Jan 10, 2025</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>
                      {selectedAppointment.startTime} - {selectedAppointment.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />
                      30 min before
                    </Badge>
                  </div>
                </div>

                {/* Participants */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Participants</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[...Array(Math.min(selectedAppointment.participants, 6))].map((_, i) => (
                        <Avatar key={i} className="w-8 h-8 border-2 border-background">
                          <AvatarImage
                            src={`/caring-doctor.png?key=p1yqi&height=32&width=32&query=doctor${i + 1}`}
                          />
                          <AvatarFallback>D{i + 1}</AvatarFallback>
                        </Avatar>
                      ))}
                      {selectedAppointment.participants > 6 && (
                        <div className="flex items-center justify-center w-8 h-8 text-xs font-medium border-2 rounded-full bg-muted border-background text-muted-foreground">
                          +{selectedAppointment.participants - 6}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">OR</span>
                    <Button variant="ghost" size="icon" className="w-8 h-8">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <span>
                      <span className="font-semibold">{selectedAppointment.participants}</span> participants
                    </span>
                    <span>
                      <span className="font-semibold">{selectedAppointment.yes}</span> yes
                    </span>
                    <span>
                      <span className="font-semibold">{selectedAppointment.waiting}</span> waiting
                    </span>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Description</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{selectedAppointment.description}</p>
                </div>

                {/* Mini Calendar */}
                <div className="p-4 border rounded-lg border-border">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">January 2025</h3>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="w-6 h-6">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="w-6 h-6">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((day) => (
                      <div key={day} className="text-xs font-medium text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    {[
                      30, 31, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
                      26, 27, 28, 29, 30, 31, 1, 2,
                    ].map((date, i) => (
                      <button
                        key={i}
                        className={`aspect-square text-xs rounded-md hover:bg-muted transition-colors ${
                          date === 10 ? "bg-primary text-primary-foreground font-semibold" : ""
                        } ${date > 27 && i < 7 ? "text-muted-foreground/50" : ""} ${
                          date < 6 && i > 28 ? "text-muted-foreground/50" : ""
                        }`}
                      >
                        {date}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 gap-2 bg-transparent">
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 gap-2 bg-transparent text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

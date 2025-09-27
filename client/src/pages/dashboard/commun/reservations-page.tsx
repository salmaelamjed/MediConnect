"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { useEffect, useState } from "react"
import { actGetReservations } from "@/store/reservations/act/actGetReservations"
import { actUpdateReservation } from "@/store/reservations/act/actUpdateReservation"
import { actDeleteReservation } from "@/store/reservations/act/actDeleteReservation"
import ReservationsSkeleton from "@/components/shared/reservations-skeleton"
import { Badge } from "@/components/ui/badge"
import type { Reservation } from "@/types/reservation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { actConfirmReservation } from "@/store/reservations/act/actConfirmReservation"
import { actCompleteReservation } from "@/store/reservations/act/actCompleteReservation"
import { actCancelReservation } from "@/store/reservations/act/actCancelReservation"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { isString } from "@/types/guard"
import { MoreHorizontal, Eye, Edit, Trash2, Clock, CheckCircle, XCircle, UserX, Calendar } from "lucide-react"

const statusConfig = {
  pending: {
    variant: "pending" as const,
    label: "Pending",
    color: " text-amber-500 border-amber-200",
    description: "Awaiting confirmation",
    icon: Clock,
  },
  confirmed: {
    variant: "confirmed" as const,
    label: "Confirmed",
    color: " text-emerald-500 border-emerald-200",
    description: "Reservation confirmed",
    icon: CheckCircle,
  },
  completed: {
    variant: "completed" as const,
    label: "Completed",
    color: "text-blue-500 border-blue-500",
    description: "Consultation completed",
    icon: Calendar,
  },
  cancelled: {
    variant: "cancel" as const,
    label: "Cancelled",
    color: " text-red-500 border-red-500",
    description: "Reservation cancelled",
    icon: XCircle,
  },
  no_show: {
    variant: "follow_up" as const,
    label: "No Show",
    color: " text-violet-500 border-violet-500",
    description: "Patient absent",
    icon: UserX,
  },
} as const

const ReservationsPage = () => {
  const { reservations, loading, error, pagination } = useAppSelector((state) => state.reservations)
  const dispatch = useAppDispatch()
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null)
  const [mode, setMode] = useState<"view" | "edit" | null>(null)
  const [openSheet, setOpenSheet] = useState(false)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [editedValues, setEditedValues] = useState<Partial<Reservation>>({})
  const [openCancelModal, setOpenCancelModal] = useState(false)
  const [openCompleteModal, setOpenCompleteModal] = useState(false)
  const [cancellationReason, setCancellationReason] = useState("")
  const [doctorNotes, setDoctorNotes] = useState("")

  useEffect(() => {
    dispatch(actGetReservations(currentPage))
  }, [dispatch, currentPage])

  useEffect(() => {
    if (mode === "edit" && selectedReservation) {
      setEditedValues({
        reason: selectedReservation.reason,
        status: selectedReservation.status,
      })
    }
  }, [mode, selectedReservation])

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.last_page || 1)) {
      setCurrentPage(page)
    }
  }

  const getPageNumbers = () => {
    if (!pagination?.last_page) return []

    const pages = []
    const totalPages = pagination.last_page
    const current = currentPage
    const delta = 2

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= current - delta && i <= current + delta)) {
        pages.push(i)
      } else if (i === current - delta - 1 || i === current + delta + 1) {
        pages.push("ellipsis")
      }
    }

    return pages
  }

  const handleDelete = () => {
    if (selectedReservation && selectedReservation.id) {
      dispatch(actDeleteReservation(selectedReservation.id)).then(() => {
        dispatch(actGetReservations(currentPage))
        setOpenDeleteDialog(false)
        setSelectedReservation(null)
      })
    }
  }

  const handleUpdate = () => {
    if (selectedReservation && selectedReservation.id) {
      dispatch(
        actUpdateReservation({
          id: selectedReservation.id,
          updates: editedValues,
        }),
      ).then(() => {
        dispatch(actGetReservations(currentPage))
        setOpenSheet(false)
        setSelectedReservation(null)
        setMode(null)
        setEditedValues({})
      })
    }
  }

  const handleStatusChange = (reservation: Reservation, newStatus: Reservation["status"]) => {
    if (newStatus === "cancelled") {
      setSelectedReservation(reservation)
      setOpenCancelModal(true)
    } else if (newStatus === "completed") {
      setSelectedReservation(reservation)
      setOpenCompleteModal(true)
    } else if (newStatus === "confirmed") {
      dispatch(actConfirmReservation(reservation.id)).then(() => {
        dispatch(actGetReservations(currentPage))
      })
      toast.success("Reservation confirmed successfully!")
    } else {
      dispatch(
        actUpdateReservation({
          id: reservation.id,
          updates: { status: newStatus },
        }),
      ).then(() => {
        dispatch(actGetReservations(currentPage))
      })
    }
  }

  const handleCancelReservation = () => {
    if (selectedReservation && selectedReservation.id) {
      if (!cancellationReason.trim()) {
        toast.error("Please provide a cancellation reason.")
        return
      }

      dispatch(
        actCancelReservation({
          id: selectedReservation.id,
          cancellation_reason: cancellationReason.trim(),
        }),
      ).then((result) => {
        if (actCancelReservation.fulfilled.match(result)) {
          dispatch(actGetReservations(currentPage))
          setOpenCancelModal(false)
          setSelectedReservation(null)
          setCancellationReason("")
          toast.success(`Reservation cancelled for: ${cancellationReason}`)
        } else if (actCancelReservation.rejected.match(result)) {
          const errorMessage = isString(result.payload)
            ? result.payload
            : "Failed to cancel reservation"
          toast.error(errorMessage)
        }
      })
    }
  }

  const handleCompleteReservation = () => {
    if (selectedReservation && selectedReservation.id) {
      if (!doctorNotes.trim()) {
        toast.error("Please provide doctor notes.")
        return
      }

      dispatch(
        actCompleteReservation({
          id: selectedReservation.id,
          doctor_notes: doctorNotes.trim(),
        }),
      ).then((result) => {
        if (actCompleteReservation.fulfilled.match(result)) {
          dispatch(actGetReservations(currentPage))
          setOpenCompleteModal(false)
          setSelectedReservation(null)
          setDoctorNotes("")
          toast.success("Consultation completed")
        } else if (actCompleteReservation.rejected.match(result)) {
          const errorMessage = isString(result.payload)
            ? result.payload
            :  "Failed to complete reservation"
          toast.error(errorMessage)
        }
      })
    }
  }

  const handleInputChange = (field: keyof Reservation, value: string) => {
    setEditedValues((prev) => ({ ...prev, [field]: value }))
  }

  if (loading === "pending") {
    return <ReservationsSkeleton />
  }

  return (
    <div className="h-screen p-6">
      <h2 className="mb-6 text-2xl font-bold">Liste des Réservations</h2>

      {error ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Erreur: {error}</div>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <Table className="w-full bg-white rounded-lg shadow table-auto min-w-[600px]">
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>ID</TableHead>
                  <TableHead>PATIENT</TableHead>
                  <TableHead>DOCTOR</TableHead>
                  <TableHead>HOUR</TableHead>
                  <TableHead>DATE</TableHead>
                  <TableHead>REASON</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations && reservations.length > 0 ? (
                  reservations.map((reservation: Reservation, index) => {
                    const StatusIcon = statusConfig[reservation.status].icon
                    const statusTextColor = statusConfig[reservation.status].color.split(" ")[1] // Extract text color (e.g., text-red-800)
                    return (
                      <TableRow
                        key={reservation.id}
                        className={index % 2 === 0 ? "bg-white text-base font-sans" : "bg-muted/20 hover:bg-muted/50"}
                      >
                        <TableCell className="font-medium">RES_{reservation.id}</TableCell>
                        <TableCell>{reservation.patient?.user?.email || reservation.patient_email}</TableCell>
                        <TableCell>{reservation.doctor?.name || "N/A"}</TableCell>
                        <TableCell>{reservation.reservation_time}</TableCell>
                        <TableCell>{new Date(reservation.reservation_date).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell>{reservation.reason || "Non spécifiée"}</TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className="relative">
                                <Badge
                                  variant={statusConfig[reservation.status].variant}
                                  className={statusConfig[reservation.status].color}
                                >
                                  <StatusIcon className={`w-3 h-3 mr-1.5 text-white ${statusTextColor}`} />
                                  <span className="text-white">{statusConfig[reservation.status].label}</span>
                                </Badge>
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-2 border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                              <div className="space-y-1">
                                {Object.entries(statusConfig)
                                  .filter(([key]) => key !== reservation.status)
                                  .map(([key, config]) => {
                                    const IconComponent = config.icon
                                    const iconColor = config.color.split(" ")[1] // Extract text color (e.g., text-red-800)
                                    return (
                                      <Button
                                        key={key}
                                        variant="ghost"
                                        className="w-full justify-start px-3 py-2.5 h-auto text-sm hover:bg-accent/50 transition-colors duration-200"
                                        onClick={() => handleStatusChange(reservation, key as Reservation["status"])}
                                      >
                                        <div className="flex items-center space-x-3">
                                          <div
                                            className={`w-2 h-2 rounded-full ${config.color.split(" ")[0]} flex-shrink-0`}
                                          ></div>
                                          <IconComponent className={`w-4 h-4 ${iconColor}`} />
                                          <div className="flex flex-col items-start">
                                            <span className="font-medium">{config.label}</span>
                                            <span className="text-xs text-muted-foreground">{config.description}</span>
                                          </div>
                                        </div>
                                      </Button>
                                    )
                                  })}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell className="text-right">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-8 h-8 p-0 transition-colors duration-200 hover:bg-accent"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-2 border-0 shadow-lg bg-white/95 backdrop-blur-sm">
                              <div className="space-y-1">
                                <div className="px-3 py-2 text-xs font-medium border-b text-muted-foreground">
                                  Actions
                                </div>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start px-3 py-2.5 h-auto text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors duration-200"
                                  onClick={() => {
                                    setSelectedReservation(reservation)
                                    setMode("view")
                                    setOpenSheet(true)
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-3" />
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">View Details</span>
                                    <span className="text-xs text-muted-foreground">See full information</span>
                                  </div>
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start px-3 py-2.5 h-auto text-sm hover:bg-amber-50 hover:text-amber-700 transition-colors duration-200"
                                  onClick={() => {
                                    setSelectedReservation(reservation)
                                    setMode("edit")
                                    setOpenSheet(true)
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-3" />
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">Edit</span>
                                    <span className="text-xs text-muted-foreground">Modify reservation</span>
                                  </div>
                                </Button>
                                <Button
                                  variant="ghost"
                                  className="w-full justify-start px-3 py-2.5 h-auto text-sm hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                                  onClick={() => {
                                    setSelectedReservation(reservation)
                                    setOpenDeleteDialog(true)
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-3" />
                                  <div className="flex flex-col items-start">
                                    <span className="font-medium">Delete</span>
                                    <span className="text-xs text-muted-foreground">Remove permanently</span>
                                  </div>
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                      </TableRow>
                    )
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                      Aucune réservation trouvée
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1)
                    }
                  }}
                />
              </PaginationItem>
              {getPageNumbers().map((page, index) =>
                page === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${index}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      isActive={currentPage === page}
                      onClick={(e) => {
                        e.preventDefault()
                        handlePageChange(page as number)
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={currentPage === pagination?.last_page ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault()
                    if (currentPage < (pagination?.last_page || 1)) {
                      handlePageChange(currentPage + 1)
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}

      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{mode === "view" ? "Détails de la Réservation" : "Modifier la Réservation"}</SheetTitle>
          </SheetHeader>
          {selectedReservation && (
            <div className="grid gap-4 py-4">
              {mode === "view" ? (
                <>
                  <div className="grid items-center grid-cols-4 gap-4">
                    <Label className="col-span-1 text-right">ID</Label>
                    <div className="col-span-3">RES_{selectedReservation.id}</div>
                  </div>
                  <div className="grid items-center grid-cols-4 gap-4">
                    <Label className="col-span-1 text-right">Patient</Label>
                    <div className="col-span-3">
                      {selectedReservation.patient?.user?.email || selectedReservation.patient_email}
                    </div>
                  </div>
                  <div className="grid items-center grid-cols-4 gap-4">
                    <Label className="col-span-1 text-right">Docteur</Label>
                    <div className="col-span-3">{selectedReservation.doctor?.name || "N/A"}</div>
                  </div>
                  <div className="grid items-center grid-cols-4 gap-4">
                    <Label className="col-span-1 text-right">Date & Heure</Label>
                    <div className="col-span-3">
                      {new Date(selectedReservation.reservation_date).toLocaleDateString("fr-FR")} à{" "}
                      {selectedReservation.reservation_time}
                    </div>
                  </div>
                  <div className="grid items-center grid-cols-4 gap-4">
                    <Label className="col-span-1 text-right">Raison</Label>
                    <div className="col-span-3">{selectedReservation.reason || "Non spécifiée"}</div>
                  </div>
                  <div className="grid items-center grid-cols-4 gap-4">
                <Label className="col-span-1 text-right">Statut</Label>
                <div className="col-span-3">
                  <Badge
                    variant={statusConfig[selectedReservation.status].variant}
                    className={statusConfig[selectedReservation.status].color}
                  >
                    {(() => {
                      const StatusIcon = statusConfig[selectedReservation.status].icon;
                      const statusTextColor = statusConfig[selectedReservation.status].color.split(" ")[1];
                      return <StatusIcon className={`w-3 h-3 mr-1.5 ${statusTextColor}`} />;
                    })()}
                    {statusConfig[selectedReservation.status].label}
                  </Badge>
                </div>
              </div>
                  {selectedReservation.cancellation_reason && (
                    <div className="grid items-center grid-cols-4 gap-4">
                      <Label className="col-span-1 text-right">Cancellation Reason</Label>
                      <div className="col-span-3">{selectedReservation.cancellation_reason}</div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="grid items-center grid-cols-4 gap-4">
                    <Label htmlFor="reason" className="col-span-1 text-right">
                      Raison
                    </Label>
                    <Input
                      id="reason"
                      value={editedValues.reason || ""}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid items-center grid-cols-4 gap-4">
                    <Label htmlFor="status" className="col-span-1 text-right">
                      Statut
                    </Label>
                    <Select
                      value={editedValues.status || selectedReservation.status}
                      onValueChange={(value) => handleInputChange("status", value)}
                    >
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                        <SelectItem value="no_show">No Show</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          )}
          {mode === "edit" && (
            <SheetFooter>
              <Button type="submit" onClick={handleUpdate}>
                Sauvegarder
              </Button>
            </SheetFooter>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la Suppression</DialogTitle>
          </DialogHeader>
          <p>Êtes-vous sûr de vouloir supprimer cette réservation ?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Annuler une Réservation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Veuillez entrer la raison de l'annulation :</p>
            <Textarea
              placeholder="Raison de l'annulation..."
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value.slice(0, 255))}
              className={cancellationReason.trim() ? "" : "border-red-500"}
            />
            {!cancellationReason.trim() && (
              <p className="text-sm text-red-500">La raison de l'annulation est requise.</p>
            )}
            {cancellationReason.length > 255 && (
              <p className="text-sm text-red-500">La raison ne peut pas dépasser 255 caractères.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCancelModal(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelReservation}
              disabled={!cancellationReason.trim() || cancellationReason.length > 255}
            >
              Confirmer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={openCompleteModal} onOpenChange={setOpenCompleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Marquer comme Terminé</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>Veuillez ajouter des notes sur la consultation :</p>
            <Textarea
              placeholder="Notes du médecin..."
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value.slice(0, 1000))}
              className={doctorNotes.trim() ? "" : "border-red-500"}
            />
            {!doctorNotes.trim() && (
              <p className="text-sm text-red-500">Les notes du médecin sont requises.</p>
            )}
            {doctorNotes.length > 1000 && (
              <p className="text-sm text-red-500">Les notes ne peuvent pas dépasser 1000 caractères.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCompleteModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCompleteReservation}
              disabled={!doctorNotes.trim() || doctorNotes.length > 1000}
            >
              Marquer comme Terminé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ReservationsPage
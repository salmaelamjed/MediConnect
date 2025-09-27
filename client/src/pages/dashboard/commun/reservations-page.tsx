import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { useEffect, useState } from "react";
import { actGetReservations } from "@/store/reservations/act/actGetReservations";
import { actUpdateReservation } from "@/store/reservations/act/actUpdateReservation";
import { actDeleteReservation } from "@/store/reservations/act/actDeleteReservation";
import ReservationsSkeleton from "@/components/shared/reservations-skeleton";
import { Badge } from "@/components/ui/badge";
import type { Reservation } from "@/types/reservation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { actConfirmReservation } from "@/store/reservations/act/actConfirmReservation";
import { actCompleteReservation } from "@/store/reservations/act/actCompleteReservation";
import { actCancelReservation } from "@/store/reservations/act/actCancelReservation";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { isString } from "@/types/guard";

const statusConfig = {
  pending: {
    variant: "secondary" as const,
    label: "Pending",
    color: "bg-orange-400 text-white font-bold",
    description: "pending confirmation ."
  },
  confirmed: {
    variant: "default" as const,
    label: "Confirmed",
    color: "bg-green-500 text-white font-bold",
    description: "Reservation confirmed."
  },
  completed: {
    variant: "default" as const,
    label: "Completed",
    color: "bg-blue-100 text-blue-800",
    description: "Consultation terminée."
  },
  cancelled: {
    variant: "destructive" as const,
    label: "Cancelled",
    color: "bg-red-500 text-white font-bold",
    description: "Reservation cancelled ."
  },
  no_show: {
    variant: "outline" as const,
    label: "No Show",
    color: "bg-violet-400 text-white font-bold",
    description: "Patient absent."
  }
} as const;

const ReservationsPage = () => {
  const { reservations, loading, error, pagination } = useAppSelector(
    (state) => state.reservations
  );
  const dispatch = useAppDispatch();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | null>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editedValues, setEditedValues] = useState<Partial<Reservation>>({});
  
  // États pour les modals d'actions spéciales
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [openCompleteModal, setOpenCompleteModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState("");
  const [doctorNotes, setDoctorNotes] = useState("");

  useEffect(() => {
    dispatch(actGetReservations(currentPage));
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (mode === "edit" && selectedReservation) {
      setEditedValues({
        reason: selectedReservation.reason,
        status: selectedReservation.status,
      });
    }
  }, [mode, selectedReservation]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= (pagination?.last_page || 1)) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    if (!pagination?.last_page) return [];

    const pages = [];
    const totalPages = pagination.last_page;
    const current = currentPage;
    const delta = 2;

    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= current - delta && i <= current + delta)
      ) {
        pages.push(i);
      } else if (i === current - delta - 1 || i === current + delta + 1) {
        pages.push("ellipsis");
      }
    }

    return pages;
  };

  const handleDelete = () => {
    if (selectedReservation && selectedReservation.id) {
      dispatch(actDeleteReservation(selectedReservation.id)).then(() => {
        dispatch(actGetReservations(currentPage));
        setOpenDeleteDialog(false);
        setSelectedReservation(null);
      });
    }
  };

  const handleUpdate = () => {
    if (selectedReservation && selectedReservation.id) {
      dispatch(
        actUpdateReservation({
          id: selectedReservation.id,
          updates: editedValues,
        })
      ).then(() => {
        dispatch(actGetReservations(currentPage));
        setOpenSheet(false);
        setSelectedReservation(null);
        setMode(null);
        setEditedValues({});
      });
    }
  };

  const handleStatusChange = (reservation: Reservation, newStatus: Reservation["status"]) => {
    // Si le statut nécessite des informations supplémentaires, ouvrir le modal approprié
    if (newStatus === "cancelled") {
      setSelectedReservation(reservation);
      setOpenCancelModal(true);
    } else if (newStatus === "completed") {
      setSelectedReservation(reservation);
      setOpenCompleteModal(true);
    } else if (newStatus === "confirmed") {
      // Confirmation simple - pas besoin de modal
      dispatch(
        actConfirmReservation(reservation.id)
      ).then(() => {
        dispatch(actGetReservations(currentPage));
      });
      toast.success('Reservation confirmed successfylly!')
    } else {
      // Autres statuts (pending, no_show)
      dispatch(
        actUpdateReservation({
          id: reservation.id,
          updates: { status: newStatus },
        })
      ).then(() => {
        dispatch(actGetReservations(currentPage));
      });
    }
  };

const handleCancelReservation = () => {
  if (selectedReservation && selectedReservation.id) {
    if (!cancellationReason.trim()) {
      toast.error("Please provide a cancellation reason.");
      return;
    }

    dispatch(
      actCancelReservation({
        id: selectedReservation.id,
        cancellation_reason: cancellationReason.trim(),
      })
    ).then((result) => {
      if (actCancelReservation.fulfilled.match(result)) {
        dispatch(actGetReservations(currentPage));
        setOpenCancelModal(false);
        setSelectedReservation(null);
        setCancellationReason("");
        toast.success(`Reservation cancelled for: ${cancellationReason}`);
      } else if (actCancelReservation.rejected.match(result)) {
        const errorMessage = isString(result.payload)
          ? result.payload
          :"Failed to cancel reservation";
        toast.error(errorMessage);
      }
    });
  }
};

  const handleCompleteReservation = () => {
    if (selectedReservation && selectedReservation.id) {
      dispatch(
        actCompleteReservation({
          id: selectedReservation.id,
          doctor_notes: doctorNotes,
        })
      ).then(() => {
        dispatch(actGetReservations(currentPage));
        setOpenCompleteModal(false);
        setSelectedReservation(null);
        setDoctorNotes("");
      });
      toast.success('Consultation completed ')
    }
    
  };

  const handleInputChange = (field: keyof Reservation, value: string) => {
    setEditedValues((prev) => ({ ...prev, [field]: value }));
  };

  if (loading === "pending") {
    return <ReservationsSkeleton />;
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
                  <TableHead>HOUR </TableHead>
                  <TableHead>DATE </TableHead>
                  <TableHead>REASON</TableHead>
                  <TableHead>STATUS</TableHead>
                  <TableHead className="text-right">ACTIONS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations && reservations.length > 0 ? (
                  reservations.map((reservation: Reservation, index) => (
                    <TableRow
                      key={reservation.id}
                      className={index % 2 === 0 ? "bg-white text-base font-sans" : "bg-muted/20 hover:bg-muted/50"}
                    >
                      <TableCell className="font-medium">RES_{reservation.id}</TableCell>
                      <TableCell>
                        {reservation.patient?.user?.email || reservation.patient_email}
                      </TableCell>
                      <TableCell>{reservation.doctor?.name || "N/A"}</TableCell>
                      <TableCell>
                        {reservation.reservation_time}
                      </TableCell>
                      <TableCell>
                        {new Date(reservation.reservation_date).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>{reservation.reason || "Non spécifiée"}</TableCell>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Badge
                              variant={statusConfig[reservation.status]?.variant || "outline"}
                              className={statusConfig[reservation.status]?.color}
                            >
                              {statusConfig[reservation.status]?.label || reservation.status}
                            </Badge>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 cursor-pointer">
                            <div className="space-y-1">
                              <ul className="space-y-1 list-none">
                                {Object.entries(statusConfig)
                                  .filter(([key]) => key !== reservation.status)
                                  .map(([key, config]) => (
                                    <li key={key}>
                                      <Button
                                        variant="ghost"
                                        className="justify-start w-full px-2 text-sm cursor-pointer"
                                        onClick={() => handleStatusChange(reservation, key as Reservation["status"])}
                                      >
                                        <span className={`w-3 h-3 rounded-full mr-2 ${config.color.split(" ")[0]}`}></span>
                                       <span className="cursor-pointer"> {config.label}</span>
                                      </Button>
                                    </li>
                                  ))}
                              </ul>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" size="sm">
                              ...
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-40">
                            <div className="grid gap-2">
                              <Button
                                variant="ghost"
                                className="justify-start px-2"
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setMode("view");
                                  setOpenSheet(true);
                                }}
                              >
                                Show Details
                              </Button>
                              <Button
                                variant="ghost"
                                className="justify-start px-2"
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setMode("edit");
                                  setOpenSheet(true);
                                }}
                              >
                                Update
                              </Button>
                              <Button
                                variant="ghost"
                                className="justify-start px-2 text-destructive"
                                onClick={() => {
                                  setSelectedReservation(reservation);
                                  setOpenDeleteDialog(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </TableRow>
                  ))
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

          {/* Pagination */}
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage > 1) {
                      handlePageChange(currentPage - 1);
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
                        e.preventDefault();
                        handlePageChange(page as number);
                      }}
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  className={
                    currentPage === pagination?.last_page ? "pointer-events-none opacity-50" : ""
                  }
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPage < (pagination?.last_page || 1)) {
                      handlePageChange(currentPage + 1);
                    }
                  }}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </>
      )}

      {/* Sheet for View/Edit */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>
              {mode === "view" ? "Détails de la Réservation" : "Modifier la Réservation"}
            </SheetTitle>
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
                        variant={statusConfig[selectedReservation.status]?.variant || "outline"}
                        className={statusConfig[selectedReservation.status]?.color}
                      >
                        {statusConfig[selectedReservation.status]?.label || selectedReservation.status}
                      </Badge>
                    </div>
                  </div>
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

      {/* Delete Confirmation Dialog */}
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

     {/* Cancel Reservation Modal */}
<Dialog open={openCancelModal} onOpenChange={setOpenCancelModal}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Cancel a Reservation</DialogTitle>
    </DialogHeader>
    <div className="space-y-4">
      <p>Enter the reason for cancellation</p>
      <Textarea
        placeholder="Reason for cancellation..."
        value={cancellationReason}
        onChange={(e) => setCancellationReason(e.target.value)}
        className={cancellationReason.trim() ? "" : "border-red-500"}
      />
      {!cancellationReason.trim() && (
        <p className="text-sm text-red-500">Cancellation reason is required.</p>
      )}
    </div>
    <DialogFooter>
      <Button variant="outline" onClick={() => setOpenCancelModal(false)}>
        Cancel
      </Button>
      <Button
        variant="destructive"
        onClick={handleCancelReservation}
        disabled={!cancellationReason.trim()}
      >
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

      {/* Complete Reservation Modal */}
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
              onChange={(e) => setDoctorNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCompleteModal(false)}>
              Annuler
            </Button>
            <Button 
              onClick={handleCompleteReservation}
              disabled={!doctorNotes.trim()}
            >
              Marquer comme Terminé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReservationsPage;
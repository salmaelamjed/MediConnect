"use client"

import { useEffect, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { actGetNotifications } from "@/store/notifications/act/actGetNotifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, CalendarCheck, X } from "lucide-react"
import { toast } from "sonner"
import { actConfirmReservation } from "@/store/reservations/act/actConfirmReservation"
import { actCancelReservation } from "@/store/reservations/act/actCancelReservation"
import { actMarkNotificationAsRead } from "@/store/notifications/act/actMarkNotificationAsRead"
import { useNavigate, useParams } from "react-router-dom"

const NotificationDetails = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const notificationId = id ? Number.parseInt(id, 10) : Number.NaN
  const { notifications = [], loading } = useAppSelector((state) => state.notifications)
  const [isLoadingActions, setIsLoadingActions] = useState(false)
  const role = localStorage.getItem("role") || "patient" // Default to patient if undefined

  useEffect(() => {
    if (loading === "idle") {
      dispatch(actGetNotifications({ page: 1 }))
    }
  }, [dispatch, loading])

  const notification = notifications.find((n: Notification) => n.id === notificationId)

  const handleConfirmReservation = async (reservationId: number) => {
    setIsLoadingActions(true)
    try {
      await dispatch(actConfirmReservation(reservationId)).unwrap()
      toast.success("Appointment confirmed successfully")
      dispatch(actGetNotifications({ page: 1 })) // Refresh notifications
    } catch (err) {
      toast.error("Failed to confirm appointment")
      console.log(err)
    } finally {
      setIsLoadingActions(false)
    }
  }

  const handleCancelReservation = async (reservationId: number) => {
    setIsLoadingActions(true)
    try {
      await dispatch(
        actCancelReservation({
          id: reservationId,
          cancellation_reason: "Cancelled by user",
        }),
      ).unwrap()
      toast.success("Appointment cancelled successfully")
      dispatch(actGetNotifications({ page: 1 })) // Refresh notifications
    } catch (err) {
      toast.error("Failed to cancel appointment")
      console.log(err)
    } finally {
      setIsLoadingActions(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await dispatch(actMarkNotificationAsRead(id)).unwrap()
      toast.success("Notification marked as read")
    } catch (err) {
      toast.error("Failed to mark notification as read")
      console.log(err)
    }
  }

  if (loading === "pending") {
    return (
      <div className="min-h-screen p-6 mx-auto">
        <p className="text-sm text-muted-foreground">Loading notification...</p>
      </div>
    )
  }

  if (!notification) {
    return (
      <div className="min-h-screen p-6 mx-auto ">
        <Button
          variant="link"
          onClick={() => navigate("/notifications")}
          className="p-0 mb-4 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Notifications
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Notification Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">The requested notification could not be found.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isDoctor = role === "doctor"
  const isAdmin = role === "admin"
  const isAppointmentConfirmation = notification.type === "appointment_confirmation"
  const hasReservation = !!notification.reservation
  const reservation = notification.reservation
  const isPending = reservation?.status === "pending"
  return (
    <div className="min-w-full min-h-screen p-6 mx-auto ">
      <Button
        variant="link"
        onClick={() => navigate("/notifications")}
        className="p-0 mb-4 text-blue-600 hover:underline"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Notifications
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{notification.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* General Info */}
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Message:</strong> {notification.message}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Type:</strong> {notification.type.replace(/_/g, " ").toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Priority:</strong> {notification.priority.toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Sent At:</strong> {new Date(notification.sent_at!).toLocaleString()}
            </p>
            {notification.action_url && (
              <a
                href={notification.action_url}
                className="text-blue-600 hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Take Action
              </a>
            )}
          </div>

          {/* Reservation Details (if available) */}
          {hasReservation && (
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="mb-2 text-lg font-semibold">Reservation Details</h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <p className="text-sm text-muted-foreground">
                  <strong>Reservation ID:</strong> {reservation!.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Date & Time:</strong> {new Date(reservation!.reservation_date).toLocaleDateString()} at{" "}
                  {reservation!.reservation_time}
                </p>
                 <p className="text-sm text-muted-foreground">
                  <strong>Status:</strong> {reservation?.reason}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Status:</strong> {reservation!.status.toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Cabinet ID:</strong> {reservation!.cabinet_id}
                </p>
              </div>

              {/* Patient Info */}
              <div className="mt-4">
                <h4 className="mb-2 font-medium text-md">Patient Information</h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <p className="text-sm text-muted-foreground">
                    <strong>Name:</strong> {reservation!.patient.user.email.split("@")[0]} {/* Fallback if no name */}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Email:</strong> {reservation!.patient.user.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>DOB:</strong> {new Date(reservation!.patient.date_of_birth).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    <strong>Gender:</strong> {reservation!.patient.gender}
                  </p>
                </div>
              </div>

              {/* Doctor Info (for patient/admin) */}
              {(!isDoctor || isAdmin) && (
                <div className="mt-4">
                  <h4 className="mb-2 font-medium text-md">Doctor Information</h4>
                  <p className="text-sm text-muted-foreground">
                    <strong>Doctor ID:</strong> {reservation!.doctor_id}
                  </p>
                  {/* Note: Doctor details would require a separate API call or relationship if available */}
                </div>
              )}
            </div>
          )}

          {/* Role-Based Actions */}
          {(isDoctor || isAdmin) && isAppointmentConfirmation && hasReservation && isPending && (
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                className="flex gap-2 text-green-500 bg-transparent border-green-500 hover:bg-green-50"
                onClick={() => handleConfirmReservation(reservation!.id)}
                disabled={isLoadingActions || reservation!.status !== "pending"}
              >
                <CalendarCheck className="w-4 h-4" />
                Confirm
              </Button>
              <Button
                variant="outline"
                className="flex gap-2 text-red-500 bg-transparent border-red-500 hover:bg-red-50"
                onClick={() => handleCancelReservation(reservation!.id)}
                disabled={isLoadingActions || reservation!.status !== "pending"}
              >
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </div>
          )}

          {!notification.is_read && (
            <Button
              variant="secondary"
              onClick={() => handleMarkAsRead(notification.id)}
              className="mt-4"
              disabled={isLoadingActions}
            >
              Mark as Read
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationDetails

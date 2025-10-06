"use client"

import { useEffect, useState } from "react"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { actGetNotifications } from "@/store/notifications/act/actGetNotifications"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarCheck, X } from "lucide-react"
import { toast } from "sonner"
import { formatDistanceToNow, parseISO } from "date-fns"
import { NotificationCard } from "@/components/shared/NotificationCard"
import { actConfirmReservation } from "@/store/reservations/act/actConfirmReservation"
import { actCancelReservation } from "@/store/reservations/act/actCancelReservation"
import { actMarkNotificationAsRead } from "@/store/notifications/act/actMarkNotificationAsRead"
import { useNavigate, useParams } from "react-router-dom"

interface Notification {
  id: number
  user_id: number
  reservation_id: number | null
  title: string
  message: string
  type:
    | "appointment_confirmation"
    | "appointment_reminder"
    | "appointment_cancellation"
    | "appointment_rescheduled"
    | "doctor_message"
    | "system_update"
    | "review_request"
  send_email: boolean
  send_push: boolean
  is_read: boolean
  read_at: string | null
  sent_at: string | null
  delivery_status: { email: string; push: string } | null
  priority: "low" | "normal" | "high" | "urgent"
  scheduled_for: string | null
  data: any | null
  action_url: string | null
  created_at: string
  updated_at: string
}

const NotificationDetails = () => {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const notificationId = id ? parseInt(id, 10) : NaN
  const { notifications = [], loading } = useAppSelector((state) => state.notifications)
  const [isLoadingActions, setIsLoadingActions] = useState(false);
  const role = localStorage.getItem("role");

  useEffect(() => {
    if (loading === "idle") {
      dispatch(actGetNotifications({ page: 1 }))
    }
  }, [dispatch, loading])

  const notification = notifications.find((n: Notification) => n.id === notificationId)

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Unknown time"
    try {
      return formatDistanceToNow(parseISO(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const handleConfirmReservation = async (reservationId: number) => {
    setIsLoadingActions(true)
    try {
      await dispatch(actConfirmReservation(reservationId)).unwrap()
      toast.success("Appointment confirmed successfully")
    } catch (err) {
      toast.error("Failed to confirm appointment")
       console.log(err)
    } finally {
      setIsLoadingActions(false)
    }
  }

  const handleDeclineReservation = async (reservationId: number) => {
    setIsLoadingActions(true)
    try {
      await dispatch(
        actCancelReservation({
          id: reservationId,
          cancellation_reason: "Declined by doctor",
        })
      ).unwrap()
      toast.success("Appointment declined successfully")
    } catch (err) {
      toast.error("Failed to decline appointment")
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
      <div className="min-h-screen p-6 mx-auto bg-gray-50 max-w-7xl">
        <p className="text-sm text-muted-foreground">Loading notification...</p>
      </div>
    )
  }



  if (!notification) {
    return (
      <div className="min-h-screen p-6 mx-auto bg-gray-50 max-w-7xl">
        <Button
          variant="link"
          onClick={() => navigate("/notifications")}
          className="p-0 mb-4 text-blue-600 hover:underline"
        >
          Back to Notifications
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Notification Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              The requested notification could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isDoctor = role === "doctor" || false // Fallback to false if user is undefined
  const isAppointmentConfirmation = notification.type === "appointment_confirmation"
  const hasReservation = notification.reservation_id !== null

  return (
    <div className="min-w-full min-h-screen p-6 mx-auto bg-gray-50">
      <Button
        variant="link"
        onClick={() => navigate("/notifications")}
        className="p-0 mb-4 text-blue-600 hover:underline"
      >
        Back to Notifications
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Notification Details</CardTitle>
        </CardHeader>
        <CardContent>
          <NotificationCard
            notification={{ ...notification, delivery_status: notification.delivery_status ?? { email: "N/A", push: "N/A" } }}
            onAccept={hasReservation ? () => handleConfirmReservation(notification.reservation_id!) : undefined}
            onDecline={hasReservation ? () => handleDeclineReservation(notification.reservation_id!) : undefined}
            onMarkAsRead={handleMarkAsRead}
          />
          <div className="mt-4 space-y-2">
            <p className="text-sm text-muted-foreground">
              <strong>Type:</strong> {notification.type.replace(/_/g, " ").toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Priority:</strong> {notification.priority.toUpperCase()}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Email Status:</strong> {notification.delivery_status?.email?.toUpperCase() ?? "N/A"}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Push Status:</strong> {notification.delivery_status?.push?.toUpperCase() ?? "N/A"}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Created:</strong> {formatTime(notification.created_at)}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Updated:</strong> {formatTime(notification.updated_at)}
            </p>
            {notification.read_at && (
              <p className="text-sm text-muted-foreground">
                <strong>Read:</strong> {formatTime(notification.read_at)}
              </p>
            )}
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
          {isDoctor && isAppointmentConfirmation && hasReservation && (
            <div className="flex justify-end gap-4 mt-6">
              <Button
                variant="outline"
                className="flex gap-2 text-green-500 border-green-500 hover:bg-green-50"
                onClick={() => handleConfirmReservation(notification.reservation_id!)}
                disabled={isLoadingActions}
              >
                <CalendarCheck className="w-4 h-4" />
                Confirm
              </Button>
              <Button
                variant="outline"
                className="flex gap-2 text-red-500 border-red-500 hover:bg-red-50"
                onClick={() => handleDeclineReservation(notification.reservation_id!)}
                disabled={isLoadingActions}
              >
                <X className="w-4 h-4" />
                Decline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default NotificationDetails
"use client"

import { useState, useEffect } from "react"
import {
  Bell,
  CheckCheck,
  Search,
  Filter,
  CalendarCheck,
  Clock,
  X,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { toast } from "sonner"
import { formatDistanceToNow } from "date-fns"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { actMarkAllNotificationsAsRead } from "@/store/notifications/act/actMarkAllNotificationsAsRead"
import { actMarkNotificationAsRead } from "@/store/notifications/act/actMarkNotificationAsRead"
import { actGetNotifications } from "@/store/notifications/act/actGetNotifications"
import { useNavigate } from "react-router-dom"

const NotificationsPage = () => {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const { notifications, loading, pagination } = useAppSelector((state) => state.notifications)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    dispatch(actGetNotifications({ page }))
  }, [dispatch, page])

  const formatTime = (dateString: string | null) => {
    if (!dateString) return "Unknown time"
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true })
    } catch {
      return dateString
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "appointment_confirmation":
        return CalendarCheck
      case "appointment_reminder":
        return Clock
      case "appointment_cancellation":
        return X
      case "appointment_rescheduled":
        return RefreshCw
      case "doctor_message":
        return MessageSquare
      case "system_update":
        return AlertTriangle
      case "review_request":
        return Star
      default:
        return Bell
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "appointment_confirmation":
        return "bg-green-500"
      case "appointment_reminder":
        return "bg-yellow-500"
      case "appointment_cancellation":
        return "bg-red-500"
      case "appointment_rescheduled":
        return "bg-orange-500"
      case "doctor_message":
        return "bg-emerald-500"
      case "system_update":
        return "bg-purple-500"
      case "review_request":
        return "bg-indigo-500"
      default:
        return "bg-gray-500"
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(actMarkAllNotificationsAsRead()).unwrap()
      toast.success("All notifications marked as read")
    } catch (error) {
      toast.error("Failed to mark all notifications as read")
      console.log(error)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await dispatch(actMarkNotificationAsRead(id)).unwrap()
    } catch (error) {
      toast.error("Failed to mark notification as read")
      console.log(error)
    }
  }

  const filteredNotifications = notifications
    .filter((notification) => {
      const matchesSearch =
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesType = typeFilter === "all" || notification.type === typeFilter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unread" && !notification.is_read) ||
        (statusFilter === "read" && notification.is_read)
      return matchesSearch && matchesType && matchesStatus
    })
    .sort((a, b) => {
      const aTime = a.sent_at ? new Date(a.sent_at).getTime() : 0
      const bTime = b.sent_at ? new Date(b.sent_at).getTime() : 0
      return bTime - aTime
    })

  // Determine navigation path based on role and cabinet_owner
  const getNotificationDetailsPath = (id: number) => {
    const role = localStorage.getItem("role")
    const cabinetOwnerStr = localStorage.getItem("is_cabinet_owner")
    const cabinetOwner = cabinetOwnerStr ? JSON.parse(cabinetOwnerStr) : false

    if ( cabinetOwner) {
      return `/owner/notifications/${id}`
    }else if (role==='doctor'){
      return `/doctor/notifications/${id}`
    }else if (role ==='admin'){
      return `/admin/notifications/${id}`
    }else{
       return `/notifications/${id}`
    }
   
  }

  return (
    <div className="min-w-full min-h-screen bg-gray-50">
      <div className="px-6 py-8 mx-auto ">
        {/* Header */}
        <div className="w-full mb-8">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h1 className="mb-1 text-3xl font-semibold text-foreground">Notifications</h1>
              <p className="text-sm text-muted-foreground">
                Stay updated with your latest activities and messages
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={handleMarkAllAsRead}
                className="gap-2 text-white bg-blue-600 hover:bg-blue-800"
                disabled={loading === "pending"}
              >
                <CheckCheck className="w-4 h-4" />
                Mark All as Read
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute w-4 h-4 -translate-y-1/2 left-3 top-1/2 text-muted-foreground" />
            <Input
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white pl-9"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                <Filter className="w-4 h-4" />
                Filter by Type
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTypeFilter("all")}>
                All Notifications
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("appointment_confirmation")}>
                Appointment Confirmations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("appointment_reminder")}>
                Appointment Reminders
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("appointment_cancellation")}>
                Appointment Cancellations
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("appointment_rescheduled")}>
                Appointment Reschedules
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("doctor_message")}>
                Doctor Messages
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("system_update")}>
                System Updates
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("review_request")}>
                Review Requests
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 bg-transparent">
                Filter by Status
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                All Statuses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("unread")}>
                Unread
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter("read")}>
                Read
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="overflow-hidden bg-white border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50/50">
                <TableHead className="text-sm font-medium text-muted-foreground">
                  Notification
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground">
                  Time
                </TableHead>
                <TableHead className="text-sm font-medium text-muted-foreground">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading === "pending" ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-20 text-center">
                    <p className="text-sm text-muted-foreground">Loading notifications...</p>
                  </TableCell>
                </TableRow>
              ) : filteredNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="py-20 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-muted">
                      <Bell className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="mb-1 text-base font-medium">No notifications</h3>
                    <p className="text-sm text-muted-foreground">You're all caught up!</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredNotifications.map((notification) => {
                  const TypeIcon = getTypeIcon(notification.type)
                  const typeColor = getTypeColor(notification.type)

                  return (
                    <TableRow
                      key={notification.id}
                      className="transition-colors cursor-pointer hover:bg-gray-50/50"
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkAsRead(notification.id)
                        }
                        const path = getNotificationDetailsPath(notification.id)
                        navigate(path)
                      }}
                    >
                      <TableCell>
                        <div className="flex items-start gap-3">
                          <div className={`${typeColor} rounded-lg p-2.5 shrink-0`}>
                            <TypeIcon className="w-5 h-5 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm font-medium text-foreground mb-0.5">
                              {notification.title}
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {formatTime(notification.sent_at)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={notification.is_read ? "secondary" : "default"}
                          className={
                            notification.is_read
                              ? "bg-gray-100 text-gray-600 hover:bg-gray-100"
                              : "bg-blue-100 text-blue-700 hover:bg-blue-100"
                          }
                        >
                          {notification.is_read ? "Read" : "Unread"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && pagination.last_page > 1 && (
          <div className="flex justify-end mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
                {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink
                      onClick={() => setPage(p)}
                      isActive={p === page}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() => setPage((prev) => Math.min(prev + 1, pagination.last_page))}
                    className={page === pagination.last_page ? "pointer-events-none opacity-50" : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>
    </div>
  )
}

export default NotificationsPage
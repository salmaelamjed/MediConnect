"use client"

import { useState, useEffect } from "react"
import { Bell, Menu, LogOut } from 'lucide-react'
import { Link, useNavigate } from "react-router-dom"
import logo from "@/assets/logo.svg"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { actAuthLogout } from "@/store/auth/authSlice"
import { actGetNotifications } from "@/store/notifications/act/actGetNotifications"

interface DashboardHeaderProps {
  toggleSidebar: () => void
}

export function DashboardHeader({ toggleSidebar }: DashboardHeaderProps) {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Get notifications from Redux store
  const { notifications, loading } = useAppSelector((state) => state.notifications)
  
  const role = localStorage.getItem("role")
  const isCabinetOwner = JSON.parse(localStorage.getItem("is_cabinet_owner") || "false")

  // Fetch notifications on mount
  useEffect(() => {
    dispatch(actGetNotifications())
  }, [dispatch])

  const getDashboardLink = () => {
    if (role === "admin") return "/admin"
    if (role === "doctor" && isCabinetOwner) return "/owner"
    if (role === "doctor") return "/doctor"
    return "/"
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      await dispatch(actAuthLogout()).unwrap()
      localStorage.removeItem("accessToken")
      localStorage.removeItem("role")
      localStorage.removeItem("is_cabinet_owner")
      toast.success("You have logged out successfully!", {
        duration: 1000
      })
      navigate("/")
    } catch (error) {
      toast.error("Failed to log out. Please try again.")
      console.log(error)
    } finally {
      setIsLoggingOut(false)
      setDialogOpen(false)
    }
  }

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Get latest 5 notifications (sorted by created_at descending)
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center h-16 gap-4 px-4 border-b bg-background/95 backdrop-blur-sm md:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <Menu className="w-5 h-5" />
      </Button>
      <Link to={getDashboardLink()}>
        <img src={logo} alt="MediConnect" className="h-16" />
      </Link>
      <div className="flex items-center gap-4 ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="relative rounded-full">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadCount > 0 && (
                <span className="text-xs text-muted-foreground">
                  {unreadCount} unread
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {loading === "pending" ? (
              <DropdownMenuItem className="justify-center">
                <span className="text-sm text-muted-foreground">Loading...</span>
              </DropdownMenuItem>
            ) : recentNotifications.length === 0 ? (
              <DropdownMenuItem className="justify-center">
                <span className="text-sm text-muted-foreground">No notifications</span>
              </DropdownMenuItem>
            ) : (
              <>
                {recentNotifications.map((notification) => (
                  <DropdownMenuItem 
                    key={notification.id} 
                    className="flex flex-col items-start gap-1 cursor-pointer"
                    onClick={() => {
                      // Optionally mark as read or navigate to action_url
                      if (notification.action_url) {
                        navigate(notification.action_url)
                      }
                    }}
                  >
                    <div className="flex items-center w-full gap-2">
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${!notification.is_read ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.is_read && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="justify-center text-sm text-primary hover:text-primary"
                  onClick={() => navigate('notifications')}
                >
                  View all notifications →
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Billing</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Logout Confirmation Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to log in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <span className="flex items-center gap-2">
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Logging out...
                </span>
              ) : (
                "Logout"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  )
}
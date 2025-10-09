"use client"

import { Menu, X, User, Calendar, Home, Info, Briefcase, Users, BookOpen, LogOut, Bell } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import logo from '@/assets/logo.svg'
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useAppDispatch, useAppSelector } from "@/store/hooks"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
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
import { actAuthLogout } from "@/store/auth/authSlice"
import { toast } from "sonner"
import { actGetNotifications } from "@/store/notifications/act/actGetNotifications"

const Header = () => {
  const { user } = useAppSelector((state) => state.auth)
  const { notifications } = useAppSelector((state) => state.notifications)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const token = localStorage.getItem("accessToken")
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  // Fetch notifications on mount if logged in
 useEffect(() => {
  if (token) {
    dispatch(actGetNotifications({ page: 1 }));
  }
}, [dispatch, token]);

  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.is_read).length

  // Get latest 5 notifications (sorted by created_at descending)
  const recentNotifications = [...notifications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  // Effet de scroll pour changer l'apparence du header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationItems = [
    { name: "Home", href: "/", icon: Home },
    { name: "About Us", href: "/about", icon: Info },
    { name: "Service", href: "/service", icon: Briefcase },
    { name: "Doctors", href: "/doctors", icon: Users },
    { name: "Blog", href: "/blog", icon: BookOpen },
  ]

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
      setIsOpen(false)
      navigate("/")
    } catch (error) {
      console.error("Logout failed:", error)
      toast.error("Failed to log out. Please try again.")
    } finally {
      setIsLoggingOut(false)
      setDialogOpen(false)
    }
  }

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 shadow-md backdrop-blur-md border-b border-gray-100' 
          : 'bg-white/80 backdrop-blur-sm'
      } supports-[backdrop-filter]:bg-white/60`}
    >
      <div className="container flex items-center justify-between h-12 px-4 mx-auto md:h-18 lg:h-20">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 shrink-0">
          <img 
            src={logo} 
            alt="MediConnect" 
            className="w-auto h-12 transition-all duration-300 sm:h-14 md:h-10 lg:h-12 xl:h-14"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="items-center hidden space-x-2 md:flex lg:space-x-3 xl:space-x-4">
          {navigationItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className="px-3 py-1.5 md:px-3 md:py-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 text-sm lg:text-base xl:text-lg font-medium text-gray-700 transition-all duration-200 rounded-lg hover:text-primary hover:bg-primary/5"
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Desktop User Section */}
        <div className="items-center hidden space-x-2 md:flex lg:space-x-3">
          {token && user ? (
            <div className="flex items-center space-x-3">
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
                  { recentNotifications.length === 0 ? (
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
                        onClick={() => navigate('/notifications')}
                      >
                        View all notifications →
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative w-12 h-12 p-0 transition-all duration-200 rounded-full md:h-10 md:w-10 hover:ring-2 hover:ring-primary/20">
                    <Avatar className="w-12 h-12 md:h-10 md:w-10">
                      <AvatarImage src="https://i.pinimg.com/736x/59/92/db/5992db2c560e19ec9a2ec15c932a5114.jpg" />
                      <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                        {user.name?.charAt(0) || user.email?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center w-full">
                      <User className="w-4 h-4 mr-2" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/appointments" className="flex items-center w-full">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>Mes rendez-vous</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setDialogOpen(true)} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
          <div className="flex items-center space-x-4 sm:space-x-5">
            <Link 
              to="/login" 
              className="text-base font-medium sm:text-lg md:text-base lg:text-lg xl:text-xl text-primary hover:text-secondary"
            >
              Sign in
            </Link>
            <Button 
              asChild 
              className="px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 lg:px-6 lg:py-3.5 xl:px-8 xl:py-4 text-base sm:text-lg md:text-base lg:text-lg xl:text-xl font-medium text-white transition-all duration-300 rounded-md shadow-lg bg-primary hover:bg-primary/90"
            >
              <Link to="/register">
                Register
              </Link>
            </Button>
          </div>
          )}
        </div>

      {/* Mobile Menu Button */}
      <div className="flex items-center space-x-2 sm:space-x-3 md:hidden">
        {token && user && (
          <>
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
                { recentNotifications.length === 0 ? (
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
                      onClick={() => navigate('/notifications')}
                    >
                      View all notifications →
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Avatar className="mr-2 w-7 h-7 sm:w-8 sm:h-8">
              <AvatarImage src="https://i.pinimg.com/736x/59/92/db/5992db2c560e19ec9a2ec15c932a5114.jpg" />
              <AvatarFallback className="text-xs font-semibold sm:text-sm bg-primary/10 text-primary">
                {user.name?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </>
        )}
  
  <Sheet open={isOpen} onOpenChange={setIsOpen}>
    <SheetTrigger asChild>
      <Button 
        variant="ghost" 
        size="icon" 
        className="transition-all duration-200 rounded-lg w-9 h-9 sm:w-10 sm:h-10 hover:bg-primary/10"
      >
        <div className="relative w-4 h-4 sm:w-5 sm:h-5">
          <Menu className={`absolute transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
        </div>
        <span className="sr-only">Toggle menu</span>
      </Button>
    </SheetTrigger>
    
    <SheetContent 
      side="right" 
      className="w-full p-0 border-l border-gray-200 sm:max-w-[20rem] md:max-w-[24rem] lg:max-w-[28rem]"
    >
      <div className="flex flex-col h-full">
        {/* Header du slide */}
        <SheetHeader className="px-4 py-3 border-b border-gray-100 sm:px-6 sm:py-4 bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center space-x-2 sm:space-x-3">
              <img src={logo} alt="MediConnect" className="w-auto h-7 sm:h-8 md:h-9 lg:h-10" />
              <span className="text-base font-bold text-gray-800 sm:text-lg lg:text-xl">MediConnect</span>
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="rounded-full"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </SheetHeader>

        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* User Info Section for Mobile */}
          {token && user && (
            <div className="px-4 py-3 border-b border-gray-100 sm:px-6 sm:py-4 bg-gray-50">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14">
                  <AvatarImage src="https://i.pinimg.com/736x/59/92/db/5992db2c560e19ec9a2ec15c932a5114.jpg" />
                  <AvatarFallback className="text-sm font-semibold sm:text-base lg:text-lg bg-primary/10 text-primary">
                    {user.name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold text-gray-800 sm:text-base lg:text-lg">{user.name}</p>
                  <p className="text-xs text-gray-600 sm:text-sm lg:text-base">{user.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="flex-1 px-2 py-3 sm:px-3 sm:py-4 md:px-3 md:py-3 lg:px-3 lg:py-4 xl:px-4 xl:py-6">
            <div className="space-y-1 lg:space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center px-2 py-2 sm:px-3 sm:py-2.5 md:px-3 md:py-2 lg:px-3 lg:py-3 xl:px-4 xl:py-3.5 space-x-2 sm:space-x-3 text-gray-700 transition-all duration-200 rounded-lg hover:text-primary hover:bg-primary/5"
                    onClick={() => setIsOpen(false)}
                  >
                    <IconComponent className="w-6 h-6 text-gray-500 transition-colors duration-200 sm:w-5 sm:h-5 md:w-4 md:h-4 lg:w-6 lg:h-6 xl:w-6 xl:h-6" />
                    <span className="text-sm font-medium sm:text-base md:text-sm lg:text-base xl:text-lg">{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* User Actions for Mobile */}
            {token && user && (
              <div className="pt-4 mt-4 space-y-1 border-t border-gray-200 sm:pt-6 sm:mt-6 lg:space-y-2">
                <Link
                  to="/profile"
                  className="flex items-center px-2 py-2 sm:px-3 sm:py-2.5 md:px-3 md:py-2 lg:px-3 lg:py-3 xl:px-4 xl:py-3.5 space-x-2 sm:space-x-3 text-gray-700 transition-all duration-200 rounded-lg hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4 text-gray-500 sm:w-5 sm:h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                  <span className="text-sm font-medium sm:text-base md:text-sm lg:text-base xl:text-lg">Mon Profil</span>
                </Link>
                <Link
                  to="/appointments"
                  className="flex items-center px-2 py-2 sm:px-3 sm:py-2.5 md:px-3 md:py-2 lg:px-3 lg:py-3 xl:px-4 xl:py-3.5 space-x-2 sm:space-x-3 text-gray-700 transition-all duration-200 rounded-lg hover:text-primary hover:bg-primary/5"
                  onClick={() => setIsOpen(false)}
                >
                  <Calendar className="w-4 h-4 text-gray-500 sm:w-5 sm:h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                  <span className="text-sm font-medium sm:text-base md:text-sm lg:text-base xl:text-lg">Mes Rendez-vous</span>
                </Link>
                <button
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center w-full px-2 py-2 sm:px-3 sm:py-2.5 md:px-3 md:py-2 lg:px-3 lg:py-3 xl:px-4 xl:py-3.5 space-x-2 sm:space-x-3 text-red-600 transition-all duration-200 rounded-lg hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4 text-red-600 sm:w-5 sm:h-5 md:w-4 md:h-4 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                  <span className="text-sm font-medium sm:text-base md:text-sm lg:text-base xl:text-lg">Se déconnecter</span>
                </button>
              </div>
            )}
          </nav>

          {/* CTA Buttons Section */}
          <div className="p-3 mt-auto border-t border-gray-100 sm:p-4 lg:p-5 bg-gray-50">
            {!token || !user ? (
              <div className="space-y-2 sm:space-y-3">
                <Button 
                  variant="outline" 
                  asChild 
                  className="w-full py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base lg:text-lg font-semibold bg-white border-2 rounded-lg hover:bg-gray-50"
                >
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    Se connecter
                  </Link>
                </Button>
                <Button 
                  asChild 
                  className="w-full py-2 sm:py-2.5 lg:py-3 text-sm sm:text-base lg:text-lg font-semibold text-white rounded-lg shadow-lg bg-primary hover:bg-primary/90"
                >
                  <Link to="/register" onClick={() => setIsOpen(false)}>
                    <Calendar className="w-4 h-4 mr-2 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                    S'inscrire
                  </Link>
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </SheetContent>
  </Sheet>
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
      </div>
    </header>
  )
}

export default Header
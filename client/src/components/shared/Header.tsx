"use client"

import { Menu, X, User, Calendar, Home, Info, Briefcase, Users, BookOpen, LogOut } from "lucide-react"
import { Link } from "react-router-dom"
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
import { actAuthLogout } from "@/store/auth/authSlice"
import { toast } from "sonner"

const Header = () => {
  const { user } = useAppSelector((state) => state.auth)
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const token = localStorage.getItem("accessToken")
  const dispatch = useAppDispatch()

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

const handleLogout = () => {
  try {
    dispatch(actAuthLogout()).unwrap();
    setIsOpen(false);
    toast.success("Logged out successfully",{duration:1000})
  } catch (error) {
    console.error("Logout failed:", error);
    toast.error("Failed to log out. Please try again.");
  }
};

  return (
    <header 
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled 
          ? 'bg-white/95 shadow-md backdrop-blur-md border-b border-gray-100' 
          : 'bg-white/80 backdrop-blur-sm'
      } supports-[backdrop-filter]:bg-white/60`}
    >
      <div className="container flex items-center justify-between h-16 px-4 mx-auto md:h-18 lg:h-20">
        
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2 shrink-0">
          <img 
            src={logo} 
            alt="MediConnect" 
            className="w-auto h-16 transition-all duration-300 md:h-10 lg:h-16"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="items-center hidden space-x-1 md:flex lg:space-x-2 xl:space-x-4">
          {navigationItems.map((item) => (
            <Link 
              key={item.name} 
              to={item.href} 
              className="px-3 py-2 text-sm font-medium text-gray-700 transition-all duration-200 rounded-lg lg:text-base hover:text-primary hover:bg-primary/5"
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
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                    <LogOut className="w-4 h-4 mr-2" />
                    <span>Se déconnecter</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center space-x-5">
                <Link to="/login" className="text-xl font-medium text-primary hover:text-secondary">
                  Sign in
                </Link>
              <Button 
                asChild 
                className="px-6 py-4 text-xl font-medium text-white transition-all duration-300 rounded-md shadow-lg md:text-base bg-primary hover:bg-primary/90"
              >
                <Link to="/register">
                  Register
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-2 md:hidden">
          {token && user && (
            <Avatar className="w-8 h-8 mr-2">
              <AvatarImage src="https://i.pinimg.com/736x/59/92/db/5992db2c560e19ec9a2ec15c932a5114.jpg" />
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {user.name?.charAt(0) || user.email?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          )}
          
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-10 h-10 transition-all duration-200 rounded-lg hover:bg-primary/10"
              >
                <div className="relative w-5 h-5">
                  <Menu className={`absolute transition-all duration-300 ${isOpen ? 'rotate-90 opacity-0' : 'rotate-0 opacity-100'}`} />
                </div>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent 
              side="right" 
              className="w-full p-0 border-l border-gray-200 sm:max-w-sm"
            >
              <div className="flex flex-col h-full">
                {/* Header du slide */}
                <SheetHeader className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="flex items-center space-x-3">
                      <img src={logo} alt="MediConnect" className="w-auto h-8" />
                      <span className="text-lg font-bold text-gray-800">MediConnect</span>
                    </SheetTitle>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsOpen(false)}
                      className="rounded-full"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </SheetHeader>

                <div className="flex flex-col flex-1 overflow-y-auto">
                  {/* User Info Section for Mobile */}
                  {token && user && (
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src="https://i.pinimg.com/736x/59/92/db/5992db2c560e19ec9a2ec15c932a5114.jpg" />
                          <AvatarFallback className="font-semibold bg-primary/10 text-primary">
                            {user.name?.charAt(0) || user.email?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-gray-800">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Links */}
                  <nav className="flex-1 px-3 py-4">
                    <div className="space-y-1">
                      {navigationItems.map((item) => {
                        const IconComponent = item.icon
                        return (
                          <Link
                            key={item.name}
                            to={item.href}
                            className="flex items-center px-3 py-3 space-x-3 text-gray-700 transition-all duration-200 rounded-lg hover:text-primary hover:bg-primary/5"
                            onClick={() => setIsOpen(false)}
                          >
                            <IconComponent className="w-5 h-5 text-gray-500 transition-colors duration-200" />
                            <span className="text-base font-medium">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>

                    {/* User Actions for Mobile */}
                    {token && user && (
                      <div className="pt-6 mt-6 space-y-1 border-t border-gray-200">
                        <Link
                          to="/profile"
                          className="flex items-center px-3 py-3 space-x-3 text-gray-700 transition-all duration-200 rounded-lg hover:text-primary hover:bg-primary/5"
                          onClick={() => setIsOpen(false)}
                        >
                          <User className="w-5 h-5 text-gray-500" />
                          <span className="text-base font-medium">Mon Profil</span>
                        </Link>
                        <Link
                          to="/appointments"
                          className="flex items-center px-3 py-3 space-x-3 text-gray-700 transition-all duration-200 rounded-lg hover:text-primary hover:bg-primary/5"
                          onClick={() => setIsOpen(false)}
                        >
                          <Calendar className="w-5 h-5 text-gray-500" />
                          <span className="text-base font-medium">Mes Rendez-vous</span>
                        </Link>
                      </div>
                    )}
                  </nav>

                  {/* CTA Buttons Section */}
                  <div className="p-4 mt-auto border-t border-gray-100 bg-gray-50">
                    {token && user ? (
                      <Button 
                        variant="outline" 
                        className="w-full py-3 font-semibold text-red-600 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300"
                        onClick={() => {
                          handleLogout()
                          setIsOpen(false)
                        }}
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Se déconnecter
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Button 
                          variant="outline" 
                          asChild 
                          className="w-full py-3 font-semibold bg-white border-2 rounded-lg hover:bg-gray-50"
                        >
                          <Link to="/login" onClick={() => setIsOpen(false)}>
                            Se connecter
                          </Link>
                        </Button>
                        <Button 
                          asChild 
                          className="w-full py-3 font-semibold text-white rounded-lg shadow-lg bg-primary hover:bg-primary/90"
                        >
                          <Link to="/register" onClick={() => setIsOpen(false)}>
                            <Calendar className="w-4 h-4 mr-2" />
                            S'inscrire
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export default Header
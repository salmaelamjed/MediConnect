"use client"

import type React from "react";
import {  ChevronLeft, ChevronRight, CreditCard, Package, Settings, Store, LayoutDashboard, User, Calendar, Stethoscope, Clock, BarChart3, Users } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAppSelector } from "@/store/hooks";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const getNavItems = (role: "admin" | "doctor"|"owner"): NavItem[] => {
  if (role === "admin") {
    return [
      { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { title: "Doctors ", href: "/admin/doctors", icon: Users },
      { title: "Patients", href: "/admin/patients", icon: Store },
      { title: "Appointments", href: "/admin/appointments", icon: Package },
      { title: "Specialties ", href: "/admin/specialties", icon: CreditCard },
      { title: "Reports",   href: "/admin/reports", icon: Package },
      { title: "Settings", href: "/admin/settings", icon: Package },
    ];
  }
  if(role==="owner"){
     return[
    { title: "Dashboard", href: "/owner", icon: LayoutDashboard },
    { title: "Patients", href: "/doctor/patients", icon: User },
    { title: "Planning", href: "/doctor/planning", icon: Calendar },
     ];
  }
  return [
    { title: "Dashboard", href: "/doctor", icon: LayoutDashboard },
    { title: "Patients", href: "/doctor/patients", icon: User },
    { title: "Planning", href: "/doctor/planning", icon: Calendar },
    { title: "Consultations", href: "/doctor/consultations", icon: Stethoscope },
    { title: "Waiting Room", href: "/doctor/waiting_room", icon: Clock },
    { title: "Staff List", href: "/doctor/staff_list", icon: Users },
    { title: "Reports", href: "/doctor/reports", icon: BarChart3 },
    { title: "Settings", href: "/doctor/settings", icon: Settings },

  ];
};

interface DashboardSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  role: "admin" | "doctor" | "owner";
}

export function DashboardSidebar({ isOpen, toggleSidebar, isCollapsed, toggleCollapse, role }: DashboardSidebarProps) {
  const { pathname } = useLocation();
  const navItems = getNavItems(role);
  const {user}=useAppSelector((state)=>state.auth);
  
  // Définir le lien actif par défaut (premier lien)
  const defaultActiveHref = navItems[0]?.href;
  const isActive = (href: string) => pathname === href || (pathname === defaultActiveHref && href === defaultActiveHref);
  
  return (
    <>
      {/* Sidebar for large screens */}
      <div
        className={cn(
          "fixed top-16 left-0 h-[calc(100vh-4rem)] border-r bg-white z-40 transition-all duration-300 hidden lg:block",
          isCollapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 py-2 overflow-auto">
            <div className="px-2 py-6">
              <nav className="grid items-start gap-1 px-2 text-xl font-medium" aria-label="Main navigation">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "group w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left font-medium text-lg transition-all duration-200 relative",
                      isActive(item.href)
                        ? "bg-blue-50 text-blue-600 shadow-sm border-r-4 border-blue-600"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-r-4 hover:border-blue-600",
                      isCollapsed && "justify-center px-2"
                    )}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors duration-200",
                      isActive(item.href) ? "text-blue-700" : "text-gray-500 group-hover:text-blue-600"
                    )} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="p-4 border-t">
            {!isCollapsed ? (
              <Button variant="outline" className="justify-start w-full gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" alt="Avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start text-xs">
                  <span>{user?.name}</span>
                  <span className="text-muted-foreground">{user?.email}</span>
                </div>
              </Button>
            ) : (
              <Button variant="outline" size="icon" className="w-full">
                <Avatar className="w-6 h-6">
                  <AvatarImage src="/placeholder.svg?height=24&width=24" alt="Avatar" />
                  <AvatarFallback>JD</AvatarFallback>
                </Avatar>
              </Button>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="absolute w-8 h-8 border rounded-full shadow-sm top-2 -right-4 bg-background"
            onClick={toggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div
        className={cn(
          "fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 border-r bg-white z-40 transform transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full gap-2">
          <div className="flex-1 py-2 overflow-auto">
            <div className="px-3 py-2">
              <nav className="grid items-start gap-1 px-2 text-sm font-medium" aria-label="Mobile navigation">
                {navItems.map((item, index) => (
                  <Link
                    key={index}
                    to={item.href}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl px-3 py-3 transition-all duration-200 relative",
                      isActive(item.href)
                        ? "bg-blue-100 text-blue-600 border-r-2 border-blue-600"
                        : "text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-r-2 hover:border-blue-600"
                    )}
                    onClick={toggleSidebar}
                  >
                    <item.icon className={cn(
                      "w-4 h-4 transition-colors duration-200",
                      isActive(item.href) ? "text-blue-600" : "text-gray-500 group-hover:text-blue-600"
                    )} />
                    {item.title}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
          <div className="p-4 border-t">
            <Button variant="outline" className="justify-start w-full gap-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src="/placeholder.svg?height=24&width=24" alt="Avatar" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-xs">
                <span>{user?.name}</span>
                <span className="text-muted-foreground">{user?.email}</span>
              </div>
            </Button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={toggleSidebar} aria-hidden="true" />
      )}
    </>
  );
}
"use client"
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSidebar } from "./dashboard-sidebar";

const OwnerDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Détecter la taille d'écran
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Calculer les classes CSS dynamiquement
  const getMainClasses = () => {
    let classes = "flex-1 p-2 lg:py-12 overflow-auto transition-all duration-300 mt-4";
    
    if (isDesktop) {
      if (isCollapsed) {
        classes += " lg:ml-16"; // Sidebar réduite (64px)
      } else if (isSidebarOpen) {
        classes += " lg:ml-60"; // Sidebar ouverte (240px)
      } else {
        classes += " lg:ml-0"; // Sidebar fermée
      }
    } else {
      classes += " ml-0"; // Mobile: toujours sans marge
    }
    
    return classes;
  };

  const getContentClasses = () => {
    let classes = "space-y-6 mx-auto transition-all duration-300 px-4";
    
    if (isDesktop) {
      if (isCollapsed) {
        classes += " max-w-[calc(100vw-4rem-2rem)]"; // Écran - sidebar réduite - padding
      } else if (isSidebarOpen) {
        classes += " max-w-[calc(100vw-15rem-2rem)]"; // Écran - sidebar ouverte - padding
      } else {
        classes += " max-w-[1000px]"; // Largeur normale quand sidebar fermée
      }
    } else {
      classes += " max-w-full py-12"; // Mobile: pleine largeur
    }
  
    return classes;
  };

  return (
    <div className="flex flex-col min-h-screen">
      <DashboardHeader toggleSidebar={toggleSidebar} />
      <div className="relative flex flex-1">
        <DashboardSidebar
          isOpen={isSidebarOpen}
          toggleSidebar={toggleSidebar}
          isCollapsed={isCollapsed}
          toggleCollapse={toggleCollapse}
          role="owner"
        />
        <main
          className={getMainClasses()}
          role="main"
          aria-label="Main dashboard content"
        >
          <div className={getContentClasses()}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default OwnerDashboard;
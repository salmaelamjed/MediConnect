"use client";

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
      // Close sidebar on mobile by default
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  // Calculer les classes CSS pour la balise <main>
  const getMainClasses = () => {
    let classes = "flex-1 p-2 lg:py-12 overflow-auto transition-all duration-300";

    if (isDesktop) {
      if (isCollapsed) {
        classes += " lg:ml-20"; // Sidebar réduite (80px)
      } else {
        classes += " lg:ml-64"; // Sidebar ouverte (256px)
      }
    } else {
      classes += isSidebarOpen ? " ml-64" : " ml-0"; // Mobile: adjust margin when sidebar is open
    }

    return classes;
  };

  // Calculer les classes CSS pour le contenu de l'Outlet
  const getContentClasses = () => {
    let classes = "space-y-6 mx-auto transition-all duration-300 px-4";

    if (isDesktop) {
      if (isCollapsed) {
        classes += " max-w-[calc(100vw-5rem)]"; // Écran - sidebar réduite
      } else {
        classes += " max-w-[calc(100vw-16rem)]"; // Écran - sidebar ouverte
      }
    } else {
      classes += isSidebarOpen
        ? " max-w-[calc(100vw-16rem)]"
        : " max-w-full"; // Mobile: pleine largeur ou ajustée si sidebar ouverte
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
};

export default OwnerDashboard;
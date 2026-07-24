import { Outlet, useLocation } from "react-router-dom";
import { useEffect, useState, type CSSProperties } from "react";
import { AppSidebar } from "../components/layout/AppSidebar";
import { MobileNav } from "../components/layout/MobileNav";
import { TopBar } from "../components/layout/TopBar";

const SIDEBAR_STORAGE_KEY = "upwrite.sidebar.shellCollapsed.v1";

const readSidebarState = () => {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
};

export const AppLayout = () => {
  const { pathname } = useLocation();
  const isWritePage = pathname === "/write" || pathname.startsWith("/write/");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(readSidebarState);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return (
    <div
      className={isWritePage ? "h-dvh overflow-hidden" : "min-h-screen"}
      style={{ "--sidebar-width": sidebarCollapsed ? "5.5rem" : "18rem" } as CSSProperties}
      data-sidebar-collapsed={sidebarCollapsed}
    >
      <AppSidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      <div className={isWritePage ? "flex h-dvh min-w-0 flex-col transition-[padding-left] duration-300 ease-out lg:pl-[var(--sidebar-width)]" : "transition-[padding-left] duration-300 ease-out lg:pl-[var(--sidebar-width)]"}>
        <TopBar />
        <main
          data-app-main
          className={
            isWritePage
              ? "mx-auto min-h-0 w-full max-w-[100rem] flex-1 overflow-hidden px-3 pb-[5.5rem] pt-2 sm:px-5 sm:pt-3 lg:px-8 lg:pb-4 lg:pt-4"
              : "mx-auto w-full max-w-[88rem] px-4 pb-24 pt-6 transition-[max-width] duration-300 ease-out sm:px-6 sm:pt-8 lg:px-8"
          }
        >
          <Outlet />
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

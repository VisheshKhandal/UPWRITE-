import { Outlet, useLocation } from "react-router-dom";
import { Suspense, type CSSProperties } from "react";
import { AppSidebar } from "../components/layout/AppSidebar";
import { MobileNav } from "../components/layout/MobileNav";
import { TopBar } from "../components/layout/TopBar";
import { RoutePageTransition } from "../motion/MotionProvider";

export const AppLayout = () => {
  const { pathname } = useLocation();
  const isWritePage = pathname === "/write" || pathname.startsWith("/write/");

  return (
    <div
      data-app-layout
      className={isWritePage ? "h-dvh overflow-hidden" : "min-h-screen"}
      style={{ "--sidebar-width": "14rem" } as CSSProperties}
    >
      <AppSidebar />
      <div
        className={
          isWritePage
            ? "flex h-dvh min-w-0 flex-col lg:pl-[var(--sidebar-width)]"
            : "lg:pl-[var(--sidebar-width)]"
        }
      >
        <TopBar />
        <main
          data-app-main
          className={
            isWritePage
              ? "mx-auto min-h-0 w-full max-w-[100rem] flex-1 overflow-hidden px-3 pb-[calc(6.25rem+env(safe-area-inset-bottom))] pt-2 sm:px-5 sm:pt-3 lg:px-8 lg:pb-4 lg:pt-4"
              : "mx-auto w-full max-w-[88rem] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pb-28"
          }
        >
          <Suspense
            fallback={
              <div className="grid min-h-[50vh] place-items-center" aria-busy="true" aria-label="Loading page">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-subtle border-t-accent" />
              </div>
            }
          >
            <RoutePageTransition className={isWritePage ? "flex h-full min-h-0 flex-col" : undefined}>
              <Outlet />
            </RoutePageTransition>
          </Suspense>
        </main>
      </div>
      <MobileNav />
    </div>
  );
};

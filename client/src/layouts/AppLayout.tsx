import { Outlet } from "react-router-dom";
import { AppSidebar } from "../components/layout/AppSidebar";
import { MobileNav } from "../components/layout/MobileNav";
import { TopBar } from "../components/layout/TopBar";
import { OnboardingGate } from "../components/onboarding/OnboardingGate";

export const AppLayout = () => (
  <div className="min-h-screen">
    <AppSidebar />
    <div className="lg:pl-72">
      <TopBar />
      <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
    <MobileNav />
    <OnboardingGate />
  </div>
);

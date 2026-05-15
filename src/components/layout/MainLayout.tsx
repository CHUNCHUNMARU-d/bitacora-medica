import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Toaster } from "@/components/ui/sonner";
import { useIdleLock } from "@/hooks/useIdleLock";

export function MainLayout() {
  useIdleLock();
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto bg-background p-6">
        <Outlet />
      </main>
      <Toaster />
    </div>
  );
}

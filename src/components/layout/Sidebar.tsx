import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LayoutDashboard, Lock, PlusSquare, Settings } from "lucide-react";

const items = [
  { to: "/", label: "Dashboard", Icon: LayoutDashboard, end: true },
  { to: "/nueva", label: "Nueva cirugía", Icon: PlusSquare, end: false },
  { to: "/configuracion", label: "Configuración", Icon: Settings, end: false },
];

export function Sidebar() {
  const { lock } = useAuth();
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="px-4 py-5">
        <p className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Bitácora Médica
        </p>
        <p className="mt-0.5 text-[10px] uppercase tracking-widest opacity-40">
          Trauma &amp; Ortopedia
        </p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2">
        {items.map(({ to, label, Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors duration-100",
                isActive
                  ? "bg-white/10 text-sidebar-foreground"
                  : "text-sidebar-foreground/60 hover:bg-white/6 hover:text-sidebar-foreground/90",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-sidebar-primary" />
                )}
                <Icon className="size-4 shrink-0" strokeWidth={1.5} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-0.5 border-t border-sidebar-border p-2">
        <div className="opacity-60 hover:opacity-100 transition-opacity duration-150">
          <ThemeToggle />
        </div>
        <div className="opacity-60 hover:opacity-100 transition-opacity duration-150">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-sidebar-foreground hover:bg-white/6 hover:text-sidebar-foreground"
            onClick={() => void lock()}
          >
            <Lock className="size-4" strokeWidth={1.5} />
            Bloquear
          </Button>
        </div>
      </div>
    </aside>
  );
}

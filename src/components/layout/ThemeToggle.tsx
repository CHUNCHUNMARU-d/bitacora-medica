import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme, type ThemeMode } from "@/lib/theme";

const NEXT: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

const LABEL: Record<ThemeMode, string> = {
  system: "Sistema",
  light: "Claro",
  dark: "Oscuro",
};

export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const Icon = mode === "system" ? Monitor : mode === "light" ? Sun : Moon;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setMode(NEXT[mode])}
      title={`Tema: ${LABEL[mode]}`}
    >
      <Icon className="size-4" />
      {LABEL[mode]}
    </Button>
  );
}

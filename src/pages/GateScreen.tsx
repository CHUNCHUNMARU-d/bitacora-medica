import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle, Lock, ShieldCheck } from "lucide-react";

export function GateScreen() {
  const { status } = useAuth();
  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Iniciando...</p>
      </main>
    );
  }
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <div className="w-full max-w-md">
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-muted-foreground">
          Bitácora · Trauma &amp; Ortopedia
        </p>
        {status === "fresh" ? <SetupCard /> : <LoginCard />}
      </div>
    </main>
  );
}

function SetupCard() {
  const { setup } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Mínimo 8 caracteres");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setBusy(true);
    try {
      await setup(password);
    } catch (err) {
      setError(String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="shadow-none border-border/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5" />
          <CardTitle>Crear contraseña</CardTitle>
        </div>
        <CardDescription>
          Esta contraseña cifra la base de datos. No se puede recuperar; si la
          olvidas, perderás el acceso a los registros.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setup-password">Contraseña</Label>
            <Input
              id="setup-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="new-password"
              className="font-mono text-sm"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="setup-confirm">Confirmar contraseña</Label>
            <Input
              id="setup-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              className="font-mono text-sm"
            />
          </div>
          {error && (
            <span className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3 shrink-0" />
              {error}
            </span>
          )}
          <Button
            type="submit"
            disabled={busy}
            className="active:scale-[0.97] transition-transform duration-75"
          >
            {busy ? "Creando..." : "Crear y entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function LoginCard() {
  const { unlock } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await unlock(password);
    } catch (err) {
      setError(String(err));
      setPassword("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="shadow-none border-border/60">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="size-5" />
          <CardTitle>Bitácora Médica</CardTitle>
        </div>
        <CardDescription>Ingresa tu contraseña para continuar.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="login-password">Contraseña</Label>
            <Input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              autoComplete="current-password"
              className="font-mono text-sm"
            />
          </div>
          {error && (
            <span className="flex items-center gap-1.5 text-xs text-destructive">
              <AlertCircle className="size-3 shrink-0" />
              {error}
            </span>
          )}
          <Button
            type="submit"
            disabled={busy || password.length === 0}
            className="active:scale-[0.97] transition-transform duration-75"
          >
            {busy ? "Verificando..." : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

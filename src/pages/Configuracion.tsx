import { useState } from "react";
import { toast } from "sonner";
import { Clock, Database, FolderDown, KeyRound } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backupDb, pickDirectory } from "@/lib/export";
import { dbRekey } from "@/lib/db";
import { useSettings } from "@/lib/settings";

const MINUTE_OPTIONS = [5, 10, 15, 30, 60];

export function Configuracion() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Configuración</h1>

      <BackupCard />
      <ChangePasswordCard />
      <AutoLockCard />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="size-5" />
            <CardTitle>Base de datos</CardTitle>
          </div>
          <CardDescription>
            La base se almacena cifrada con SQLCipher (AES-256) en el directorio
            de datos de la aplicación.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function BackupCard() {
  const [busy, setBusy] = useState(false);

  async function onBackup() {
    setBusy(true);
    try {
      const dir = await pickDirectory();
      if (!dir) return;
      const result = await backupDb(dir);
      toast.success(`Respaldo creado: ${result.db}`);
    } catch (e) {
      toast.error(`Error al respaldar: ${e}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FolderDown className="size-5" />
          <CardTitle>Respaldo</CardTitle>
        </div>
        <CardDescription>
          Copia el archivo cifrado y su salt a un directorio que elijas. Para
          restaurar, reemplaza ambos archivos en el directorio de datos.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onBackup} disabled={busy}>
          {busy ? "Respaldando..." : "Crear respaldo..."}
        </Button>
      </CardContent>
    </Card>
  );
}

function ChangePasswordCard() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres");
      return;
    }
    if (newPassword !== confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setBusy(true);
    try {
      await dbRekey(oldPassword, newPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
      toast.success("Contraseña actualizada");
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <KeyRound className="size-5" />
          <CardTitle>Cambiar contraseña</CardTitle>
        </div>
        <CardDescription>
          Re-cifra la base con una nueva contraseña. La anterior dejará de
          funcionar.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 md:max-w-md">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="old">Contraseña actual</Label>
            <Input
              id="old"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new">Nueva contraseña</Label>
            <Input
              id="new"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-confirm">Confirmar</Label>
            <Input
              id="new-confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {error && <span className="text-xs text-destructive">{error}</span>}
          <Button
            type="submit"
            disabled={
              busy ||
              oldPassword.length === 0 ||
              newPassword.length === 0 ||
              confirm.length === 0
            }
          >
            {busy ? "Actualizando..." : "Actualizar contraseña"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function AutoLockCard() {
  const { autoLock, setAutoLock } = useSettings();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Clock className="size-5" />
          <CardTitle>Auto-bloqueo</CardTitle>
        </div>
        <CardDescription>
          Bloquea la app automáticamente tras un período sin actividad.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 md:max-w-md">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoLock.enabled}
            onChange={(e) =>
              void setAutoLock({ ...autoLock, enabled: e.target.checked })
            }
          />
          Activar auto-bloqueo
        </label>

        <div className="flex flex-col gap-1.5">
          <Label>Intervalo</Label>
          <Select
            value={String(autoLock.minutes)}
            onValueChange={(v) =>
              void setAutoLock({ ...autoLock, minutes: Number(v) })
            }
          >
            <SelectTrigger className="w-40" disabled={!autoLock.enabled}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MINUTE_OPTIONS.map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} minutos
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

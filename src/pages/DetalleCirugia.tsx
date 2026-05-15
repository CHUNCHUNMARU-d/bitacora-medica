import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { CirugiaForm } from "@/components/forms/CirugiaForm";
import { RadiografiasSection } from "@/components/radiografias/RadiografiasSection";
import {
  deleteCirugia,
  getCirugia,
  getCirugiasByPaciente,
  updateCirugia,
} from "@/hooks/useCirugias";
import { savePdf } from "@/lib/export";
import { FileText } from "lucide-react";
import type { Cirugia } from "@/lib/types";
import type { CirugiaFormValues } from "@/lib/schemas";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function DetalleCirugia() {
  const { id } = useParams<{ id: string }>();
  const numericId = Number(id);
  const navigate = useNavigate();

  const [record, setRecord] = useState<Cirugia | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(numericId)) {
      setError("ID inválido");
      setLoading(false);
      return;
    }
    getCirugia(numericId)
      .then((r) => {
        if (!r) setError("No encontrado");
        setRecord(r);
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [numericId]);

  async function onSubmit(values: CirugiaFormValues) {
    try {
      await updateCirugia(numericId, {
        ...values,
        nss: values.nss.trim() || null,
        observaciones: values.observaciones.trim() || null,
      });
      toast.success("Cambios guardados");
      const refreshed = await getCirugia(numericId);
      setRecord(refreshed);
    } catch (e) {
      toast.error(`Error al actualizar: ${e}`);
    }
  }

  async function onExportPatientPdf() {
    if (!record) return;
    try {
      const history = await getCirugiasByPaciente(record.nombre_paciente);
      const safeName = record.nombre_paciente
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      const path = await savePdf(
        history,
        `Historial de ${record.nombre_paciente}`,
        `historial-${safeName}.pdf`,
        `${history.length} registro(s)`,
      );
      if (path) toast.success(`PDF guardado en ${path}`);
    } catch (e) {
      toast.error(`Error al generar PDF: ${e}`);
    }
  }

  async function onDelete() {
    try {
      await deleteCirugia(numericId);
      toast.success("Cirugía eliminada");
      navigate("/");
    } catch (e) {
      toast.error(`Error al eliminar: ${e}`);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!record) return null;

  const initialValues: CirugiaFormValues = {
    fecha_cirugia: record.fecha_cirugia,
    nombre_paciente: record.nombre_paciente,
    edad: record.edad,
    sexo: record.sexo,
    nss: record.nss ?? "",
    diagnostico: record.diagnostico,
    procedimiento_quirurgico: record.procedimiento_quirurgico,
    rol_cirujano: record.rol_cirujano,
    observaciones: record.observaciones ?? "",
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{record.nombre_paciente}</h1>
          <p className="text-sm text-muted-foreground">
            {record.fecha_cirugia} · {record.procedimiento_quirurgico}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onExportPatientPdf}>
            <FileText className="size-4" />
            Reporte PDF
          </Button>
          <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
            Eliminar
          </Button>
        </div>
      </header>

      <CirugiaForm
        initialValues={initialValues}
        onSubmit={onSubmit}
        submitLabel="Guardar cambios"
        onCancel={() => navigate("/")}
      />

      <RadiografiasSection cirugiaId={numericId} />

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar cirugía</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

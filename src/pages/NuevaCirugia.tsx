import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { CirugiaForm } from "@/components/forms/CirugiaForm";
import { RadiografiaPicker } from "@/components/radiografias/RadiografiaPicker";
import { createCirugia } from "@/hooks/useCirugias";
import { uploadRadiografia } from "@/lib/radiografias";
import type { CirugiaFormValues } from "@/lib/schemas";
import type { PendingRadiografia } from "@/lib/types";

export function NuevaCirugia() {
  const navigate = useNavigate();
  const [pending, setPending] = useState<PendingRadiografia[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(values: CirugiaFormValues) {
    setSubmitting(true);
    try {
      const id = await createCirugia({
        ...values,
        nss: values.nss.trim() || null,
        observaciones: values.observaciones.trim() || null,
      });

      let uploadedOk = 0;
      let uploadedFailed = 0;
      for (const p of pending) {
        try {
          await uploadRadiografia(id, p.source_path, p.caption.trim() || null);
          uploadedOk += 1;
        } catch (e) {
          uploadedFailed += 1;
          toast.error(`Error al subir ${p.filename}: ${e}`);
        }
      }

      if (uploadedFailed === 0) {
        toast.success(
          pending.length === 0
            ? "Cirugía registrada"
            : `Cirugía registrada con ${uploadedOk} radiografía${uploadedOk === 1 ? "" : "s"}`,
        );
      } else {
        toast.success(
          `Cirugía registrada (${uploadedOk}/${pending.length} radiografías subidas)`,
        );
      }
      navigate(`/cirugia/${id}`);
    } catch (e) {
      toast.error(`Error al guardar: ${e}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold">Nueva cirugía</h1>
      <CirugiaForm
        onSubmit={onSubmit}
        submitLabel={submitting ? "Guardando…" : "Registrar"}
        onCancel={() => navigate(-1)}
        extraFields={
          <RadiografiaPicker
            value={pending}
            onChange={setPending}
            disabled={submitting}
          />
        }
      />
    </div>
  );
}

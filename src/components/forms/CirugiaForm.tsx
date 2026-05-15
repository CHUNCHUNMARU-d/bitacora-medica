import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cirugiaSchema, type CirugiaFormValues } from "@/lib/schemas";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RolCirujano, Sexo } from "@/lib/types";

const ROLES: RolCirujano[] = [
  "Cirujano titular",
  "Primer ayudante",
  "Segundo ayudante",
  "Observador",
];

const SEXOS: { value: Sexo; label: string }[] = [
  { value: "M", label: "Masculino" },
  { value: "F", label: "Femenino" },
];

const DEFAULTS: CirugiaFormValues = {
  fecha_cirugia: new Date().toISOString().slice(0, 10),
  nombre_paciente: "",
  edad: 0,
  sexo: "M",
  nss: "",
  diagnostico: "",
  procedimiento_quirurgico: "",
  rol_cirujano: "Cirujano titular",
  observaciones: "",
};

interface Props {
  initialValues?: Partial<CirugiaFormValues>;
  onSubmit: (values: CirugiaFormValues) => Promise<void> | void;
  submitLabel?: string;
  onCancel?: () => void;
  extraFields?: React.ReactNode;
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="col-span-full mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </p>
  );
}

export function CirugiaForm({
  initialValues,
  onSubmit,
  submitLabel = "Guardar",
  onCancel,
  extraFields,
}: Props) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<CirugiaFormValues>({
    resolver: zodResolver(cirugiaSchema),
    defaultValues: { ...DEFAULTS, ...initialValues },
  });

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid grid-cols-1 gap-4 md:grid-cols-2"
    >
      <GroupLabel>Registro</GroupLabel>

      <Field label="Fecha de cirugía" error={errors.fecha_cirugia?.message}>
        <Input type="date" {...register("fecha_cirugia")} />
      </Field>

      <Field label="Nombre del paciente" error={errors.nombre_paciente?.message}>
        <Input {...register("nombre_paciente")} />
      </Field>

      <GroupLabel>Paciente</GroupLabel>

      <Field label="Edad" error={errors.edad?.message}>
        <Input
          type="number"
          min={1}
          max={149}
          {...register("edad", { valueAsNumber: true })}
        />
      </Field>

      <Field label="Sexo" error={errors.sexo?.message}>
        <Controller
          control={control}
          name="sexo"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {SEXOS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <Field label="NSS" error={errors.nss?.message}>
        <Input {...register("nss")} placeholder="Opcional" />
      </Field>

      <Field label="Rol del cirujano" error={errors.rol_cirujano?.message}>
        <Controller
          control={control}
          name="rol_cirujano"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona" />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </Field>

      <GroupLabel>Intervención</GroupLabel>

      <Field label="Diagnóstico" error={errors.diagnostico?.message}>
        <Input {...register("diagnostico")} />
      </Field>

      <Field
        label="Procedimiento quirúrgico"
        error={errors.procedimiento_quirurgico?.message}
      >
        <Input {...register("procedimiento_quirurgico")} />
      </Field>

      <GroupLabel>Notas</GroupLabel>

      <div className="md:col-span-2">
        <Field label="Observaciones" error={errors.observaciones?.message}>
          <Textarea rows={4} {...register("observaciones")} />
        </Field>
      </div>

      {extraFields}

      <div className="flex gap-2 md:col-span-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="active:scale-[0.97] transition-transform duration-75"
        >
          {isSubmitting ? "Guardando..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </div>
    </form>
  );
}

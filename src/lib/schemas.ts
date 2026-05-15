import { z } from "zod";

export const cirugiaSchema = z.object({
  fecha_cirugia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  nombre_paciente: z.string().min(1, "Requerido").max(200),
  edad: z
    .number({ message: "Requerido" })
    .int()
    .positive("Debe ser mayor a 0")
    .max(149, "Edad inválida"),
  sexo: z.enum(["M", "F"]),
  nss: z.string().max(50),
  diagnostico: z.string().min(1, "Requerido").max(1000, "Máximo 1000 caracteres"),
  procedimiento_quirurgico: z
    .string()
    .min(1, "Requerido")
    .max(500, "Máximo 500 caracteres"),
  rol_cirujano: z.enum([
    "Cirujano titular",
    "Primer ayudante",
    "Segundo ayudante",
    "Observador",
  ]),
  observaciones: z.string().max(2000, "Máximo 2000 caracteres"),
});

export type CirugiaFormValues = z.infer<typeof cirugiaSchema>;

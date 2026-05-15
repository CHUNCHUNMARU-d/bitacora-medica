export type Sexo = "M" | "F";

export type RolCirujano =
  | "Cirujano titular"
  | "Primer ayudante"
  | "Segundo ayudante"
  | "Observador";

export interface Cirugia {
  id: number;
  fecha_cirugia: string;
  nombre_paciente: string;
  edad: number;
  sexo: Sexo;
  nss: string | null;
  diagnostico: string;
  procedimiento_quirurgico: string;
  rol_cirujano: RolCirujano;
  observaciones: string | null;
  created_at: string;
  updated_at: string;
}

export type CirugiaInput = Omit<Cirugia, "id" | "created_at" | "updated_at">;

export interface RadiografiaMeta {
  id: number;
  cirugia_id: number;
  filename: string;
  mime_type: string;
  caption: string | null;
  created_at: string;
}

export interface PendingRadiografia {
  source_path: string;
  filename: string;
  caption: string;
}

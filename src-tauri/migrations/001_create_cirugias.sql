CREATE TABLE IF NOT EXISTS cirugias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fecha_cirugia TEXT NOT NULL,
  nombre_paciente TEXT NOT NULL,
  edad INTEGER NOT NULL CHECK(edad > 0 AND edad < 150),
  sexo TEXT NOT NULL CHECK(sexo IN ('M', 'F')),
  nss TEXT,
  diagnostico TEXT NOT NULL,
  procedimiento_quirurgico TEXT NOT NULL,
  rol_cirujano TEXT NOT NULL CHECK(rol_cirujano IN (
    'Cirujano titular',
    'Primer ayudante',
    'Segundo ayudante',
    'Observador'
  )),
  observaciones TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cirugias_fecha ON cirugias(fecha_cirugia);
CREATE INDEX IF NOT EXISTS idx_cirugias_paciente ON cirugias(nombre_paciente);
CREATE INDEX IF NOT EXISTS idx_cirugias_procedimiento ON cirugias(procedimiento_quirurgico);

CREATE VIRTUAL TABLE IF NOT EXISTS cirugias_fts USING fts5(
  nombre_paciente,
  diagnostico,
  procedimiento_quirurgico,
  observaciones,
  content='cirugias',
  content_rowid='id'
);

INSERT INTO cirugias_fts(rowid, nombre_paciente, diagnostico, procedimiento_quirurgico, observaciones)
SELECT id, nombre_paciente, diagnostico, procedimiento_quirurgico, observaciones
FROM cirugias;

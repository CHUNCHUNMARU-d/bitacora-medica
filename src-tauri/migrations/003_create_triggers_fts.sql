CREATE TRIGGER IF NOT EXISTS cirugias_ai AFTER INSERT ON cirugias BEGIN
  INSERT INTO cirugias_fts(rowid, nombre_paciente, diagnostico, procedimiento_quirurgico, observaciones)
  VALUES (new.id, new.nombre_paciente, new.diagnostico, new.procedimiento_quirurgico, new.observaciones);
END;

CREATE TRIGGER IF NOT EXISTS cirugias_ad AFTER DELETE ON cirugias BEGIN
  INSERT INTO cirugias_fts(cirugias_fts, rowid, nombre_paciente, diagnostico, procedimiento_quirurgico, observaciones)
  VALUES ('delete', old.id, old.nombre_paciente, old.diagnostico, old.procedimiento_quirurgico, old.observaciones);
END;

CREATE TRIGGER IF NOT EXISTS cirugias_au AFTER UPDATE ON cirugias BEGIN
  INSERT INTO cirugias_fts(cirugias_fts, rowid, nombre_paciente, diagnostico, procedimiento_quirurgico, observaciones)
  VALUES ('delete', old.id, old.nombre_paciente, old.diagnostico, old.procedimiento_quirurgico, old.observaciones);
  INSERT INTO cirugias_fts(rowid, nombre_paciente, diagnostico, procedimiento_quirurgico, observaciones)
  VALUES (new.id, new.nombre_paciente, new.diagnostico, new.procedimiento_quirurgico, new.observaciones);
END;

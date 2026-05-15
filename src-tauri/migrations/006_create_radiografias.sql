CREATE TABLE IF NOT EXISTS radiografias (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cirugia_id INTEGER NOT NULL REFERENCES cirugias(id),
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  bytes BLOB NOT NULL,
  caption TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_radiografias_cirugia ON radiografias(cirugia_id);

CREATE TRIGGER IF NOT EXISTS trg_cirugia_soft_delete_cascade
AFTER UPDATE OF deleted_at ON cirugias
WHEN NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL
BEGIN
  UPDATE radiografias
     SET deleted_at = NEW.deleted_at
   WHERE cirugia_id = NEW.id AND deleted_at IS NULL;
END;

use std::fs;
use std::path::{Path, PathBuf};

use argon2::{Algorithm, Argon2, Params, Version};
use parking_lot::{Mutex, MutexGuard};
use rand::RngCore;
use rusqlite::{params, Connection, Row};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, State};
use thiserror::Error;

const DB_FILE: &str = "bitacora.db";
const SALT_FILE: &str = "bitacora.salt";
const PENDING_SALT_FILE: &str = "bitacora.salt.pending";
const REKEY_BACKUP_DB_FILE: &str = "bitacora.rekey-backup.db";
const REKEY_BACKUP_SALT_FILE: &str = "bitacora.rekey-backup.salt";
const SCHEMA_VERSION: i64 = 6;
const MAX_IMAGE_BYTES: usize = 15 * 1024 * 1024;

const MIGRATION_001: &str = include_str!("../migrations/001_create_cirugias.sql");
const MIGRATION_002: &str = include_str!("../migrations/002_create_fts_index.sql");
const MIGRATION_003: &str = include_str!("../migrations/003_create_triggers_fts.sql");
const MIGRATION_004: &str = include_str!("../migrations/004_rebuild_fts.sql");
const MIGRATION_005: &str = include_str!("../migrations/005_add_deleted_at.sql");
const MIGRATION_006: &str = include_str!("../migrations/006_create_radiografias.sql");

#[derive(Default)]
pub struct DbState {
    conn: Mutex<Option<Connection>>,
}

#[derive(Debug, Error)]
pub enum DbError {
    #[error("{0}")]
    Message(String),
}

impl From<rusqlite::Error> for DbError {
    fn from(value: rusqlite::Error) -> Self {
        DbError::Message(value.to_string())
    }
}

impl From<std::io::Error> for DbError {
    fn from(value: std::io::Error) -> Self {
        DbError::Message(value.to_string())
    }
}

impl From<argon2::Error> for DbError {
    fn from(value: argon2::Error) -> Self {
        DbError::Message(value.to_string())
    }
}

impl serde::Serialize for DbError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

type DbResult<T> = Result<T, DbError>;

#[derive(Serialize)]
#[serde(rename_all = "lowercase")]
pub enum DbStatus {
    Fresh,
    Locked,
    Unlocked,
}

#[derive(Debug, Clone, Serialize)]
pub struct Cirugia {
    id: i64,
    fecha_cirugia: String,
    nombre_paciente: String,
    edad: i64,
    sexo: String,
    nss: Option<String>,
    diagnostico: String,
    procedimiento_quirurgico: String,
    rol_cirujano: String,
    observaciones: Option<String>,
    created_at: String,
    updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CirugiaInput {
    fecha_cirugia: String,
    nombre_paciente: String,
    edad: i64,
    sexo: String,
    nss: Option<String>,
    diagnostico: String,
    procedimiento_quirurgico: String,
    rol_cirujano: String,
    observaciones: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct CirugiaListParams {
    search: Option<String>,
    procedimiento: Option<String>,
    desde: Option<String>,
    hasta: Option<String>,
    sort: String,
}

#[derive(Debug, Serialize)]
pub struct MonthBucket {
    ym: String,
    count: i64,
}

#[derive(Debug, Serialize)]
pub struct ProcedimientoBucket {
    procedimiento: String,
    count: i64,
}

#[derive(Debug, Deserialize)]
pub struct StatsParams {
    #[serde(rename = "currentYm")]
    current_ym: String,
    months: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct Stats {
    total: i64,
    #[serde(rename = "esteMes")]
    este_mes: i64,
    #[serde(rename = "topProcedimiento")]
    top_procedimiento: Option<String>,
    #[serde(rename = "porMes")]
    por_mes: Vec<MonthBucket>,
    #[serde(rename = "topProcedimientos")]
    top_procedimientos: Vec<ProcedimientoBucket>,
}

#[derive(Serialize)]
pub struct BackupResult {
    db: String,
    salt: String,
}

fn data_dir(app: &AppHandle) -> DbResult<PathBuf> {
    let dir = app
        .path()
        .app_data_dir()
        .map_err(|e| DbError::Message(format!("app_data_dir: {e}")))?;
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn app_local_data_dir(app: &AppHandle) -> DbResult<PathBuf> {
    let dir = app
        .path()
        .app_local_data_dir()
        .map_err(|e| DbError::Message(format!("app_local_data_dir: {e}")))?;
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn document_dir(app: &AppHandle) -> DbResult<PathBuf> {
    app.path()
        .document_dir()
        .map_err(|e| DbError::Message(format!("document_dir: {e}")))
}

fn db_path(app: &AppHandle) -> DbResult<PathBuf> {
    Ok(data_dir(app)?.join(DB_FILE))
}

fn salt_path(app: &AppHandle) -> DbResult<PathBuf> {
    Ok(data_dir(app)?.join(SALT_FILE))
}

fn pending_salt_path(app: &AppHandle) -> DbResult<PathBuf> {
    Ok(data_dir(app)?.join(PENDING_SALT_FILE))
}

fn rekey_backup_db_path(app: &AppHandle) -> DbResult<PathBuf> {
    Ok(data_dir(app)?.join(REKEY_BACKUP_DB_FILE))
}

fn rekey_backup_salt_path(app: &AppHandle) -> DbResult<PathBuf> {
    Ok(data_dir(app)?.join(REKEY_BACKUP_SALT_FILE))
}

fn read_salt(path: &Path) -> DbResult<[u8; 16]> {
    let bytes = fs::read(path)?;
    if bytes.len() != 16 {
        return Err(DbError::Message("corrupt salt file".into()));
    }
    let mut salt = [0u8; 16];
    salt.copy_from_slice(&bytes);
    Ok(salt)
}

fn write_salt(path: &Path, salt: &[u8; 16]) -> DbResult<()> {
    fs::write(path, salt)?;
    Ok(())
}

fn load_or_create_salt(app: &AppHandle, create: bool) -> DbResult<[u8; 16]> {
    let path = salt_path(app)?;
    if path.exists() {
        read_salt(&path)
    } else if create {
        let mut salt = [0u8; 16];
        rand::thread_rng().fill_bytes(&mut salt);
        write_salt(&path, &salt)?;
        Ok(salt)
    } else {
        Err(DbError::Message("salt missing".into()))
    }
}

fn derive_key(password: &str, salt: &[u8]) -> DbResult<[u8; 32]> {
    let mut key = [0u8; 32];
    Argon2::new(Algorithm::Argon2id, Version::V0x13, Params::default()).hash_password_into(
        password.as_bytes(),
        salt,
        &mut key,
    )?;
    Ok(key)
}

fn open_with_key(path: &Path, key: &[u8; 32]) -> DbResult<Connection> {
    let conn = Connection::open(path)?;
    let hex_key = hex::encode(key);
    conn.pragma_update(None, "key", format!("x'{hex_key}'"))?;
    Ok(conn)
}

fn verify_connection(conn: &Connection) -> DbResult<()> {
    conn.query_row("SELECT count(*) FROM sqlite_master", [], |row| {
        row.get::<_, i64>(0)
    })?;
    Ok(())
}

fn run_migrations(conn: &mut Connection) -> DbResult<()> {
    let current: i64 = conn
        .query_row("PRAGMA user_version", [], |row| row.get(0))
        .unwrap_or(0);

    if current >= SCHEMA_VERSION {
        return Ok(());
    }

    let tx = conn.transaction()?;
    if current < 1 {
        tx.execute_batch(MIGRATION_001)?;
    }
    if current < 2 {
        tx.execute_batch(MIGRATION_002)?;
    }
    if current < 3 {
        tx.execute_batch(MIGRATION_003)?;
    }
    if current < 4 {
        tx.execute_batch(MIGRATION_004)?;
    }
    if current < 5 {
        tx.execute_batch(MIGRATION_005)?;
    }
    if current < 6 {
        tx.execute_batch(MIGRATION_006)?;
    }
    tx.pragma_update(None, "user_version", SCHEMA_VERSION)?;
    tx.commit()?;
    Ok(())
}

fn open_verified_with_salt(db: &Path, password: &str, salt: &[u8; 16]) -> DbResult<Connection> {
    let key = derive_key(password, salt)?;
    let conn = open_with_key(db, &key)?;
    verify_connection(&conn)?;
    Ok(conn)
}

fn open_for_unlock(app: &AppHandle, password: &str) -> DbResult<(Connection, [u8; 16], bool)> {
    let db = db_path(app)?;
    let active_salt_path = salt_path(app)?;
    let active_salt = read_salt(&active_salt_path)?;
    if let Ok(conn) = open_verified_with_salt(&db, password, &active_salt) {
        cleanup_rekey_artifacts(app)?;
        return Ok((conn, active_salt, false));
    }

    let pending_path = pending_salt_path(app)?;
    if pending_path.exists() {
        let pending_salt = read_salt(&pending_path)?;
        if let Ok(conn) = open_verified_with_salt(&db, password, &pending_salt) {
            write_salt(&active_salt_path, &pending_salt)?;
            cleanup_rekey_artifacts(app)?;
            return Ok((conn, pending_salt, true));
        }
    }

    Err(DbError::Message("Contraseña incorrecta".into()))
}

fn cleanup_rekey_artifacts(app: &AppHandle) -> DbResult<()> {
    for path in [
        pending_salt_path(app)?,
        rekey_backup_db_path(app)?,
        rekey_backup_salt_path(app)?,
    ] {
        if path.exists() {
            fs::remove_file(path)?;
        }
    }
    Ok(())
}

fn allowed_roots(app: &AppHandle) -> DbResult<Vec<PathBuf>> {
    Ok(vec![
        data_dir(app)?,
        app_local_data_dir(app)?,
        document_dir(app)?,
    ])
}

fn canonical_parent(path: &Path) -> DbResult<PathBuf> {
    let parent = path
        .parent()
        .ok_or_else(|| DbError::Message("Ruta sin directorio padre".into()))?;
    Ok(parent.canonicalize()?)
}

fn ensure_path_in_allowed_roots(app: &AppHandle, path: &Path) -> DbResult<()> {
    let parent = canonical_parent(path)?;
    for root in allowed_roots(app)? {
        if parent.starts_with(root.canonicalize()?) {
            return Ok(());
        }
    }
    Err(DbError::Message(
        "Ruta fuera de los directorios permitidos por la app".into(),
    ))
}

fn ensure_dir_in_allowed_roots(app: &AppHandle, path: &Path) -> DbResult<()> {
    let dir = path.canonicalize()?;
    if !dir.is_dir() {
        return Err(DbError::Message("Directorio destino inválido".into()));
    }
    for root in allowed_roots(app)? {
        if dir.starts_with(root.canonicalize()?) {
            return Ok(());
        }
    }
    Err(DbError::Message(
        "Directorio fuera de los directorios permitidos por la app".into(),
    ))
}

fn optional_trimmed(value: &Option<String>) -> Option<String> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToOwned::to_owned)
}

fn validate_date(value: &str, field: &str) -> DbResult<()> {
    let bytes = value.as_bytes();
    let ok = bytes.len() == 10
        && bytes[4] == b'-'
        && bytes[7] == b'-'
        && bytes
            .iter()
            .enumerate()
            .all(|(i, b)| i == 4 || i == 7 || b.is_ascii_digit());
    if ok {
        Ok(())
    } else {
        Err(DbError::Message(format!(
            "{field} debe tener formato YYYY-MM-DD"
        )))
    }
}

fn validate_month(value: &str, field: &str) -> DbResult<()> {
    let bytes = value.as_bytes();
    let ok = bytes.len() == 7
        && bytes[4] == b'-'
        && bytes
            .iter()
            .enumerate()
            .all(|(i, b)| i == 4 || b.is_ascii_digit());
    if ok {
        Ok(())
    } else {
        Err(DbError::Message(format!(
            "{field} debe tener formato YYYY-MM"
        )))
    }
}

fn validate_input(input: &CirugiaInput) -> DbResult<()> {
    validate_date(&input.fecha_cirugia, "fecha_cirugia")?;
    if input.nombre_paciente.trim().is_empty() || input.nombre_paciente.chars().count() > 200 {
        return Err(DbError::Message("Nombre del paciente inválido".into()));
    }
    if !(1..150).contains(&input.edad) {
        return Err(DbError::Message("Edad inválida".into()));
    }
    if !matches!(input.sexo.as_str(), "M" | "F") {
        return Err(DbError::Message("Sexo inválido".into()));
    }
    if input.diagnostico.trim().is_empty() {
        return Err(DbError::Message("Diagnóstico requerido".into()));
    }
    if input.diagnostico.chars().count() > 1000 {
        return Err(DbError::Message(
            "Diagnóstico demasiado largo (máx 1000)".into(),
        ));
    }
    if input.procedimiento_quirurgico.trim().is_empty() {
        return Err(DbError::Message(
            "Procedimiento quirúrgico requerido".into(),
        ));
    }
    if input.procedimiento_quirurgico.chars().count() > 500 {
        return Err(DbError::Message(
            "Procedimiento quirúrgico demasiado largo (máx 500)".into(),
        ));
    }
    if input
        .observaciones
        .as_deref()
        .map(|s| s.chars().count())
        .unwrap_or(0)
        > 2000
    {
        return Err(DbError::Message(
            "Observaciones demasiado largas (máx 2000)".into(),
        ));
    }
    if !matches!(
        input.rol_cirujano.as_str(),
        "Cirujano titular" | "Primer ayudante" | "Segundo ayudante" | "Observador"
    ) {
        return Err(DbError::Message("Rol del cirujano inválido".into()));
    }
    Ok(())
}

fn fts_query(raw: &str) -> String {
    raw.split_whitespace()
        .map(|t| t.replace('"', ""))
        .filter(|t| !t.is_empty())
        .map(|t| format!("\"{t}\"*"))
        .collect::<Vec<_>>()
        .join(" AND ")
}

fn row_to_cirugia(row: &Row<'_>) -> rusqlite::Result<Cirugia> {
    Ok(Cirugia {
        id: row.get("id")?,
        fecha_cirugia: row.get("fecha_cirugia")?,
        nombre_paciente: row.get("nombre_paciente")?,
        edad: row.get("edad")?,
        sexo: row.get("sexo")?,
        nss: row.get("nss")?,
        diagnostico: row.get("diagnostico")?,
        procedimiento_quirurgico: row.get("procedimiento_quirurgico")?,
        rol_cirujano: row.get("rol_cirujano")?,
        observaciones: row.get("observaciones")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn require_conn<'a>(guard: &'a MutexGuard<'_, Option<Connection>>) -> DbResult<&'a Connection> {
    guard
        .as_ref()
        .ok_or_else(|| DbError::Message("DB bloqueada".into()))
}

#[tauri::command]
pub fn db_status(app: AppHandle, state: State<'_, DbState>) -> DbResult<DbStatus> {
    if state.conn.lock().is_some() {
        return Ok(DbStatus::Unlocked);
    }
    let db = db_path(&app)?;
    let salt = salt_path(&app)?;
    if db.exists() && salt.exists() {
        Ok(DbStatus::Locked)
    } else {
        Ok(DbStatus::Fresh)
    }
}

#[tauri::command]
pub fn db_setup(app: AppHandle, state: State<'_, DbState>, password: String) -> DbResult<()> {
    if password.len() < 8 {
        return Err(DbError::Message(
            "La contraseña debe tener al menos 8 caracteres".into(),
        ));
    }
    let db = db_path(&app)?;
    let salt = salt_path(&app)?;
    if db.exists() || salt.exists() {
        return Err(DbError::Message("La base ya está inicializada".into()));
    }
    cleanup_rekey_artifacts(&app)?;
    let salt_bytes = load_or_create_salt(&app, true)?;
    let key = derive_key(&password, &salt_bytes)?;
    let mut conn = open_with_key(&db, &key)?;
    verify_connection(&conn)?;
    run_migrations(&mut conn)?;
    *state.conn.lock() = Some(conn);
    Ok(())
}

#[tauri::command]
pub fn db_unlock(app: AppHandle, state: State<'_, DbState>, password: String) -> DbResult<()> {
    let (mut conn, _, _) = open_for_unlock(&app, &password)?;
    run_migrations(&mut conn)?;
    *state.conn.lock() = Some(conn);
    Ok(())
}

#[tauri::command]
pub fn db_lock(state: State<'_, DbState>) -> DbResult<()> {
    state.conn.lock().take();
    Ok(())
}

#[tauri::command]
pub fn db_rekey(
    app: AppHandle,
    state: State<'_, DbState>,
    old_password: String,
    new_password: String,
) -> DbResult<()> {
    if new_password.len() < 8 {
        return Err(DbError::Message(
            "La nueva contraseña debe tener al menos 8 caracteres".into(),
        ));
    }

    let db = db_path(&app)?;
    let salt = salt_path(&app)?;
    let pending_salt = pending_salt_path(&app)?;
    let backup_db = rekey_backup_db_path(&app)?;
    let backup_salt = rekey_backup_salt_path(&app)?;

    let (probe, _, _) = open_for_unlock(&app, &old_password)?;

    let mut new_salt = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut new_salt);
    write_salt(&pending_salt, &new_salt)?;

    fs::copy(&db, &backup_db)?;
    fs::copy(&salt, &backup_salt)?;

    let mut guard = state.conn.lock();
    guard.take();
    drop(guard);

    let new_key = derive_key(&new_password, &new_salt)?;
    let hex_key = hex::encode(new_key);
    probe.pragma_update(None, "rekey", format!("x'{hex_key}'"))?;

    // Atomic promotion: rename pending_salt → active salt so that if the
    // rename fails after a successful rekey, open_for_unlock can still
    // recover via its pending_salt fallback path.
    fs::rename(&pending_salt, &salt)?;
    cleanup_rekey_artifacts(&app)?;

    *state.conn.lock() = Some(probe);
    Ok(())
}

#[tauri::command]
pub fn cirugias_list(
    state: State<'_, DbState>,
    params: CirugiaListParams,
) -> DbResult<Vec<Cirugia>> {
    if let Some(desde) = params.desde.as_deref().filter(|v| !v.is_empty()) {
        validate_date(desde, "desde")?;
    }
    if let Some(hasta) = params.hasta.as_deref().filter(|v| !v.is_empty()) {
        validate_date(hasta, "hasta")?;
    }

    let order_by = match params.sort.as_str() {
        "fecha_desc" => "c.fecha_cirugia DESC, c.id DESC",
        "fecha_asc" => "c.fecha_cirugia ASC, c.id ASC",
        "paciente_asc" => "c.nombre_paciente COLLATE NOCASE ASC",
        "paciente_desc" => "c.nombre_paciente COLLATE NOCASE DESC",
        _ => return Err(DbError::Message("Orden inválido".into())),
    };

    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;

    let columns = "c.id, c.fecha_cirugia, c.nombre_paciente, c.edad, c.sexo, c.nss, c.diagnostico, c.procedimiento_quirurgico, c.rol_cirujano, c.observaciones, c.created_at, c.updated_at";
    let mut sql = if params.search.as_deref().unwrap_or("").trim().is_empty() {
        format!("SELECT {columns} FROM cirugias c WHERE c.deleted_at IS NULL")
    } else {
        format!(
            "SELECT {columns} FROM cirugias c JOIN cirugias_fts fts ON fts.rowid = c.id WHERE cirugias_fts MATCH ? AND c.deleted_at IS NULL"
        )
    };

    let mut values: Vec<String> = Vec::new();
    if let Some(search) = params
        .search
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        values.push(fts_query(search));
    }
    if let Some(procedimiento) = params
        .procedimiento
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        sql.push_str(" AND c.procedimiento_quirurgico = ?");
        values.push(procedimiento.to_string());
    }
    if let Some(desde) = params.desde.as_deref().filter(|v| !v.is_empty()) {
        sql.push_str(" AND c.fecha_cirugia >= ?");
        values.push(desde.to_string());
    }
    if let Some(hasta) = params.hasta.as_deref().filter(|v| !v.is_empty()) {
        sql.push_str(" AND c.fecha_cirugia <= ?");
        values.push(hasta.to_string());
    }
    sql.push_str(" ORDER BY ");
    sql.push_str(order_by);

    let params: Vec<&dyn rusqlite::ToSql> =
        values.iter().map(|v| v as &dyn rusqlite::ToSql).collect();
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(params.as_slice(), row_to_cirugia)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

#[tauri::command]
pub fn procedimientos_list(state: State<'_, DbState>) -> DbResult<Vec<String>> {
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    let mut stmt = conn.prepare(
        "SELECT DISTINCT procedimiento_quirurgico FROM cirugias WHERE deleted_at IS NULL ORDER BY procedimiento_quirurgico COLLATE NOCASE ASC",
    )?;
    let rows = stmt.query_map([], |row| row.get::<_, String>(0))?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

#[tauri::command]
pub fn cirugia_get(state: State<'_, DbState>, id: i64) -> DbResult<Option<Cirugia>> {
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    let mut stmt = conn.prepare(
        "SELECT id, fecha_cirugia, nombre_paciente, edad, sexo, nss, diagnostico, procedimiento_quirurgico, rol_cirujano, observaciones, created_at, updated_at FROM cirugias WHERE id = ? AND deleted_at IS NULL",
    )?;
    match stmt.query_row(params![id], row_to_cirugia) {
        Ok(row) => Ok(Some(row)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.into()),
    }
}

#[tauri::command]
pub fn cirugias_by_paciente(state: State<'_, DbState>, nombre: String) -> DbResult<Vec<Cirugia>> {
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    let mut stmt = conn.prepare(
        "SELECT id, fecha_cirugia, nombre_paciente, edad, sexo, nss, diagnostico, procedimiento_quirurgico, rol_cirujano, observaciones, created_at, updated_at FROM cirugias WHERE nombre_paciente = ? AND deleted_at IS NULL ORDER BY fecha_cirugia ASC, id ASC",
    )?;
    let rows = stmt.query_map(params![nombre], row_to_cirugia)?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

#[tauri::command]
pub fn cirugia_create(state: State<'_, DbState>, input: CirugiaInput) -> DbResult<i64> {
    validate_input(&input)?;
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    conn.execute(
        "INSERT INTO cirugias (
          fecha_cirugia, nombre_paciente, edad, sexo, nss,
          diagnostico, procedimiento_quirurgico, rol_cirujano, observaciones
        ) VALUES (?,?,?,?,?,?,?,?,?)",
        params![
            input.fecha_cirugia.trim(),
            input.nombre_paciente.trim(),
            input.edad,
            input.sexo,
            optional_trimmed(&input.nss),
            input.diagnostico.trim(),
            input.procedimiento_quirurgico.trim(),
            input.rol_cirujano,
            optional_trimmed(&input.observaciones),
        ],
    )?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn cirugia_update(state: State<'_, DbState>, id: i64, input: CirugiaInput) -> DbResult<()> {
    validate_input(&input)?;
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    conn.execute(
        "UPDATE cirugias SET
          fecha_cirugia = ?, nombre_paciente = ?, edad = ?, sexo = ?, nss = ?,
          diagnostico = ?, procedimiento_quirurgico = ?, rol_cirujano = ?,
          observaciones = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?",
        params![
            input.fecha_cirugia.trim(),
            input.nombre_paciente.trim(),
            input.edad,
            input.sexo,
            optional_trimmed(&input.nss),
            input.diagnostico.trim(),
            input.procedimiento_quirurgico.trim(),
            input.rol_cirujano,
            optional_trimmed(&input.observaciones),
            id,
        ],
    )?;
    Ok(())
}

#[tauri::command]
pub fn cirugia_delete(state: State<'_, DbState>, id: i64) -> DbResult<()> {
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    conn.execute(
        "UPDATE cirugias SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
        params![id],
    )?;
    Ok(())
}

#[derive(Debug, Clone, Serialize)]
pub struct RadiografiaMeta {
    id: i64,
    cirugia_id: i64,
    filename: String,
    mime_type: String,
    caption: Option<String>,
    created_at: String,
}

fn validate_image_bytes(bytes: &[u8]) -> DbResult<&'static str> {
    if bytes.len() > MAX_IMAGE_BYTES {
        return Err(DbError::Message(format!(
            "Archivo demasiado grande (máx {} MB)",
            MAX_IMAGE_BYTES / (1024 * 1024)
        )));
    }
    if bytes.starts_with(&[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]) {
        return Ok("image/png");
    }
    if bytes.starts_with(&[0xFF, 0xD8, 0xFF]) {
        return Ok("image/jpeg");
    }
    if bytes.len() >= 12 && &bytes[0..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        return Ok("image/webp");
    }
    if bytes.len() >= 12 && &bytes[4..8] == b"ftyp" {
        let brand = &bytes[8..12];
        if matches!(
            brand,
            b"heic" | b"heix" | b"heif" | b"mif1" | b"msf1" | b"hevc" | b"hevx"
        ) {
            return Ok("image/heic");
        }
    }
    Err(DbError::Message(
        "Formato no soportado. Usa PNG, JPEG, WebP o HEIC.".into(),
    ))
}

#[tauri::command]
pub fn radiografia_upload(
    state: State<'_, DbState>,
    cirugia_id: i64,
    source_path: String,
    caption: Option<String>,
) -> DbResult<i64> {
    let path = PathBuf::from(&source_path);
    let bytes = fs::read(&path)
        .map_err(|e| DbError::Message(format!("No se pudo leer el archivo: {e}")))?;
    let mime_type = validate_image_bytes(&bytes)?;
    let filename = path
        .file_name()
        .map(|s| s.to_string_lossy().into_owned())
        .unwrap_or_else(|| "image".into());
    if filename.chars().count() > 255 {
        return Err(DbError::Message("Nombre de archivo demasiado largo".into()));
    }
    let caption_trimmed = optional_trimmed(&caption);
    if caption_trimmed
        .as_deref()
        .map(|s| s.chars().count())
        .unwrap_or(0)
        > 200
    {
        return Err(DbError::Message(
            "Descripción demasiado larga (máx 200)".into(),
        ));
    }

    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    let parent_ok: bool = conn
        .query_row(
            "SELECT 1 FROM cirugias WHERE id = ? AND deleted_at IS NULL",
            params![cirugia_id],
            |_| Ok(true),
        )
        .unwrap_or(false);
    if !parent_ok {
        return Err(DbError::Message("Cirugía no encontrada".into()));
    }
    conn.execute(
        "INSERT INTO radiografias (cirugia_id, filename, mime_type, bytes, caption)
         VALUES (?,?,?,?,?)",
        params![cirugia_id, filename, mime_type, bytes, caption_trimmed],
    )?;
    Ok(conn.last_insert_rowid())
}

#[tauri::command]
pub fn radiografia_list(
    state: State<'_, DbState>,
    cirugia_id: i64,
) -> DbResult<Vec<RadiografiaMeta>> {
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    let mut stmt = conn.prepare(
        "SELECT id, cirugia_id, filename, mime_type, caption, created_at
           FROM radiografias
          WHERE cirugia_id = ? AND deleted_at IS NULL
          ORDER BY created_at ASC, id ASC",
    )?;
    let rows = stmt.query_map(params![cirugia_id], |row| {
        Ok(RadiografiaMeta {
            id: row.get(0)?,
            cirugia_id: row.get(1)?,
            filename: row.get(2)?,
            mime_type: row.get(3)?,
            caption: row.get(4)?,
            created_at: row.get(5)?,
        })
    })?;
    rows.collect::<Result<Vec<_>, _>>().map_err(Into::into)
}

#[tauri::command]
pub fn radiografia_bytes(state: State<'_, DbState>, id: i64) -> DbResult<Vec<u8>> {
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    let bytes: Vec<u8> = conn.query_row(
        "SELECT bytes FROM radiografias WHERE id = ? AND deleted_at IS NULL",
        params![id],
        |row| row.get(0),
    )?;
    Ok(bytes)
}

#[tauri::command]
pub fn radiografia_update_caption(
    state: State<'_, DbState>,
    id: i64,
    caption: Option<String>,
) -> DbResult<()> {
    let caption_trimmed = optional_trimmed(&caption);
    if caption_trimmed
        .as_deref()
        .map(|s| s.chars().count())
        .unwrap_or(0)
        > 200
    {
        return Err(DbError::Message(
            "Descripción demasiado larga (máx 200)".into(),
        ));
    }
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    conn.execute(
        "UPDATE radiografias SET caption = ? WHERE id = ? AND deleted_at IS NULL",
        params![caption_trimmed, id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn radiografia_delete(state: State<'_, DbState>, id: i64) -> DbResult<()> {
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;
    conn.execute(
        "UPDATE radiografias SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL",
        params![id],
    )?;
    Ok(())
}

#[tauri::command]
pub fn stats_get(state: State<'_, DbState>, params: StatsParams) -> DbResult<Stats> {
    validate_month(&params.current_ym, "currentYm")?;
    if params.months.is_empty() {
        return Err(DbError::Message("Se requiere al menos un mes".into()));
    }
    for month in &params.months {
        validate_month(month, "months")?;
    }

    let earliest_ym = params.months.iter().map(String::as_str).min().unwrap();
    let cutoff = format!("{earliest_ym}-01");
    let guard = state.conn.lock();
    let conn = require_conn(&guard)?;

    let total = conn.query_row(
        "SELECT COUNT(*) FROM cirugias WHERE deleted_at IS NULL",
        [],
        |row| row.get(0),
    )?;
    let este_mes = conn.query_row(
        "SELECT COUNT(*) FROM cirugias WHERE deleted_at IS NULL AND substr(fecha_cirugia, 1, 7) = ?",
        params![params.current_ym],
        |row| row.get(0),
    )?;

    let mut proc_stmt = conn.prepare(
        "SELECT procedimiento_quirurgico, COUNT(*) as count
         FROM cirugias
         WHERE deleted_at IS NULL
         GROUP BY procedimiento_quirurgico
         ORDER BY count DESC
         LIMIT 5",
    )?;
    let proc_rows = proc_stmt.query_map([], |row| {
        Ok(ProcedimientoBucket {
            procedimiento: row.get(0)?,
            count: row.get(1)?,
        })
    })?;
    let top_procedimientos = proc_rows.collect::<Result<Vec<_>, _>>()?;

    let mut month_stmt = conn.prepare(
        "SELECT substr(fecha_cirugia, 1, 7) as ym, COUNT(*) as count
         FROM cirugias
         WHERE deleted_at IS NULL AND fecha_cirugia >= ?
         GROUP BY ym",
    )?;
    let month_rows = month_stmt.query_map(params![cutoff], |row| {
        Ok(MonthBucket {
            ym: row.get(0)?,
            count: row.get(1)?,
        })
    })?;
    let month_counts = month_rows
        .collect::<Result<Vec<_>, _>>()?
        .into_iter()
        .map(|bucket| (bucket.ym, bucket.count))
        .collect::<std::collections::HashMap<_, _>>();
    let por_mes = params
        .months
        .into_iter()
        .map(|ym| MonthBucket {
            count: month_counts.get(&ym).copied().unwrap_or(0),
            ym,
        })
        .collect();

    Ok(Stats {
        total,
        este_mes,
        top_procedimiento: top_procedimientos
            .first()
            .map(|bucket| bucket.procedimiento.clone()),
        por_mes,
        top_procedimientos,
    })
}

#[tauri::command]
pub fn write_text_file(app: AppHandle, path: String, content: String) -> DbResult<()> {
    let path = PathBuf::from(path);
    ensure_path_in_allowed_roots(&app, &path)?;
    fs::write(&path, content)?;
    Ok(())
}

#[tauri::command]
pub fn write_binary_file(app: AppHandle, path: String, bytes: Vec<u8>) -> DbResult<()> {
    let path = PathBuf::from(path);
    ensure_path_in_allowed_roots(&app, &path)?;
    fs::write(&path, bytes)?;
    Ok(())
}

#[tauri::command]
pub fn db_backup_to(app: AppHandle, dir: String) -> DbResult<BackupResult> {
    let dest = PathBuf::from(&dir);
    ensure_dir_in_allowed_roots(&app, &dest)?;
    let src_db = db_path(&app)?;
    let src_salt = salt_path(&app)?;
    if !src_db.exists() || !src_salt.exists() {
        return Err(DbError::Message("No hay base que respaldar".into()));
    }
    let stamp = chrono_stamp();
    let dest_db = dest.join(format!("bitacora-{stamp}.db"));
    let dest_salt = dest.join(format!("bitacora-{stamp}.salt"));
    fs::copy(&src_db, &dest_db)?;
    fs::copy(&src_salt, &dest_salt)?;
    Ok(BackupResult {
        db: dest_db.to_string_lossy().into_owned(),
        salt: dest_salt.to_string_lossy().into_owned(),
    })
}

fn chrono_stamp() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let secs = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);
    secs.to_string()
}

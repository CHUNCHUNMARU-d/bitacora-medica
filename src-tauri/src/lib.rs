mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(db::DbState::default())
        .invoke_handler(tauri::generate_handler![
            db::db_status,
            db::db_setup,
            db::db_unlock,
            db::db_lock,
            db::db_rekey,
            db::cirugias_list,
            db::procedimientos_list,
            db::cirugia_get,
            db::cirugias_by_paciente,
            db::cirugia_create,
            db::cirugia_update,
            db::cirugia_delete,
            db::radiografia_upload,
            db::radiografia_list,
            db::radiografia_bytes,
            db::radiografia_update_caption,
            db::radiografia_delete,
            db::stats_get,
            db::write_text_file,
            db::write_binary_file,
            db::db_backup_to,
        ])
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

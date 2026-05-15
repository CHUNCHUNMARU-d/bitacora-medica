// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // WebKitGTK 2.44+ enabled the DMABUF renderer by default. On many Wayland
    // sessions (Hyprland, NVIDIA proprietary, some VM setups) GBM buffer
    // allocation fails and the WebView crashes with
    // `Gdk-Message: Error 71 (Protocol error) dispatching to Wayland display`,
    // closing the window milliseconds after it opens. Disabling DMABUF is the
    // upstream-recommended workaround until WebKitGTK is rebased on GTK4.
    #[cfg(target_os = "linux")]
    {
        if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    bitacora_medica_lib::run()
}

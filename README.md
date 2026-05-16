# Bitácora Médica — Trauma y Ortopedia

Aplicación de escritorio offline-first para el registro y consulta de historial
quirúrgico en trauma y ortopedia. La base de datos vive en el dispositivo del
usuario, cifrada con SQLCipher, sin servidores ni telemetría.

## Stack

- Tauri 2 (Rust) + React 19 + TypeScript 5.8
- SQLite con SQLCipher (`rusqlite` con `bundled-sqlcipher`)
- Argon2id para derivación de llaves
- Tailwind v4 + shadcn/ui (radix-nova)
- Recharts para gráficas; jsPDF + autoTable para reportes
- Vitest para pruebas unitarias

## Requisitos

- Node.js 20+
- Rust estable (vía `rustup`)

### Windows

- WebView2 Runtime (preinstalado en Windows 11; en Windows 10 lo instala el bundler).
- Microsoft C++ Build Tools (Visual Studio Build Tools 2022, workload "Desktop development with C++").
- Strawberry Perl — necesario para compilar el OpenSSL vendorizado de SQLCipher.

  ```powershell
  choco install -y strawberryperl
  ```

### macOS

- Xcode Command Line Tools: `xcode-select --install`.

### Linux

- Debian / Ubuntu:

  ```bash
  sudo apt install -y libwebkit2gtk-4.1-dev libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev librsvg2-dev libgtk-3-dev libayatana-appindicator3-dev \
    patchelf
  ```

- Arch / Omarchy:

  ```bash
  sudo pacman -S --needed webkit2gtk-4.1 libsoup3 gtk3 librsvg openssl base-devel
  ```

- Fedora / RHEL:

  ```bash
  sudo dnf install -y webkit2gtk4.1-devel libsoup3-devel librsvg2-devel \
    gtk3-devel libappindicator-gtk3-devel patchelf
  ```

> **Wayland / Hyprland / NVIDIA**: WebKitGTK 2.44+ habilita por defecto el
> renderer DMABUF que falla en muchas sesiones Wayland con
> `Gdk-Message: Error 71 (Protocol error)` y la ventana se cierra al instante.
> La app fuerza `WEBKIT_DISABLE_DMABUF_RENDERER=1` desde `src-tauri/src/main.rs`
> para evitarlo. Si necesitas el renderer DMABUF, exporta
> `WEBKIT_DISABLE_DMABUF_RENDERER=0` antes de lanzar la app.

## Instalación

```bash
npm install
```

## Desarrollo

```bash
npm run tauri dev
```

La primera vez se mostrará una pantalla para crear contraseña (mínimo 8
caracteres). Esa contraseña cifra la base; no se puede recuperar.

## Pruebas

```bash
npm test           # ejecución única
npm run test:watch # modo watch
```

## Build de producción

```bash
npm run tauri build
```

Bundles generados en `src-tauri/target/release/bundle/`:

- **Linux**: `appimage/bitacora-medica_<version>_amd64.AppImage` y
  `deb/bitacora-medica_<version>_amd64.deb`
- **macOS**: `dmg/bitacora-medica_<version>_aarch64.dmg` (Apple Silicon) —
  correr el build en macOS. Intel macOS no se distribuye (Apple discontinuó
  los Macs Intel en 2023).
- **Windows**: `msi/bitacora-medica_<version>_x64_en-US.msi` (correr el build en
  Windows con las VS Build Tools instaladas)

Tauri solo puede generar el bundle del SO en el que se ejecuta. La pipeline
oficial corre los tres en paralelo: ver `.github/workflows/release.yml`. Para
disparar una release, crea un tag `vX.Y.Z` y haz push — GitHub Actions
compilará y subirá los bundles como un release draft.

Para distribuir a un cliente macOS sin certificado de Apple Developer ID, ver
[`docs/BUILD_MACOS.md`](./docs/BUILD_MACOS.md) — incluye instrucciones para el
build y el procedimiento de Gatekeeper que el cliente debe seguir en el primer
arranque.

Manual de usuario final: [`docs/MANUAL_USUARIO.md`](./docs/MANUAL_USUARIO.md).

## Estructura

```
src/
├── components/      # UI (forms, layout, tables, dashboard widgets)
├── hooks/           # useCirugias, useStats, useIdleLock
├── lib/             # db (invoke wrapper), auth, theme, settings, csv, fts, dates
├── pages/           # Dashboard, NuevaCirugia, DetalleCirugia, Configuracion, GateScreen
└── App.tsx          # providers + router

src-tauri/
├── src/
│   ├── db.rs        # comandos: db_status, db_setup, db_unlock, db_lock,
│   │                #           db_rekey, db_query, db_execute, db_backup_to,
│   │                #           write_text_file, write_binary_file
│   └── lib.rs       # builder + invoke_handler
├── migrations/      # 001..003, embebidas vía include_str! y gateadas con PRAGMA user_version
└── capabilities/    # permisos de Tauri
```

## Seguridad

- **Cifrado en reposo**: SQLCipher (AES-256-CBC) con llave derivada de la
  contraseña mediante Argon2id (salt aleatorio de 16 bytes en
  `app_data_dir/bitacora.salt`).
- **Sin telemetría**: la app no se conecta a ningún servidor.
- **Sandbox**: capabilities de Tauri restringen el acceso al filesystem a
  `$APPDATA`, `$APPLOCALDATA` y `$DOCUMENT`; los comandos Rust de exportación y
  respaldo validan esas mismas rutas antes de escribir.
- **Cambio de contraseña**: re-encripta la base con `PRAGMA rekey` y un nuevo
  salt. La app escribe un salt pendiente y copias internas de recuperación antes
  del cambio para poder recuperarse de una interrupción durante el re-cifrado.
- **Auto-bloqueo**: opcional, configurable (5/10/15/30/60 min). Inactivo por
  defecto.

## Respaldo y restauración

1. **Configuración → Crear respaldo...**: copia `bitacora.db` y
   `bitacora.salt` (con timestamp) al directorio elegido.
2. **Restaurar**: con la app cerrada, reemplaza ambos archivos en el directorio
   de datos (`~/.local/share/com.bitacora.medica/` en Linux,
   `%APPDATA%/com.bitacora.medica/` en Windows,
   `~/Library/Application Support/com.bitacora.medica/` en macOS) y renombra
   sin el timestamp. Abre la app y entra con la contraseña que estaba activa
   cuando se generó el respaldo.

## Troubleshooting

- **Linux: la ventana abre y se cierra al instante** — Wayland + WebKitGTK
  DMABUF. La app ya inyecta `WEBKIT_DISABLE_DMABUF_RENDERER=1` desde
  `src-tauri/src/main.rs`; si modificas esa lógica y vuelve el problema,
  exporta la variable antes de lanzar.
- **Windows: `cargo build` falla con error de OpenSSL / Perl** — instala
  Strawberry Perl (`choco install strawberryperl`). SQLCipher vendoriza
  OpenSSL y necesita `perl` en `PATH`.
- **macOS: "está dañada y no se puede abrir"** — atributo de cuarentena en
  builds sin firmar. Ver [`docs/BUILD_MACOS.md`](./docs/BUILD_MACOS.md),
  sección "Procedimiento de Gatekeeper".

## Licencia

Privado / TBD.

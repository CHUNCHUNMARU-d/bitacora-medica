# Build de macOS (Apple Silicon)

Instrucciones para generar un `.dmg` para Apple Silicon (M1/M2/M3/M4). Solo
puede hacerse desde una Mac — Tauri solo empaqueta para el SO en el que se
ejecuta el build.

## Requisitos en la Mac

1. **Xcode Command Line Tools**

   ```bash
   xcode-select --install
   ```

2. **Rust** (toolchain estable):

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   source "$HOME/.cargo/env"
   ```

   Verifica: `rustc --version` debe imprimir 1.75+.

3. **Node.js 20+** — vía `nvm`, `brew install node`, o el instalador oficial.

## Build

```bash
git clone <repo-url> bitacora-medica
cd bitacora-medica
npm install
npm run tauri build
```

La primera compilación tarda ~5-10 min (Rust compila WebKit bindings desde
fuente). Builds posteriores son cuestión de segundos.

## Salida

Bundles en `src-tauri/target/release/bundle/`:

- **`dmg/bitacora-medica_0.1.0_aarch64.dmg`** — instalador para Apple Silicon.
  Es el archivo que entregas al cliente.
- `macos/bitacora-medica.app` — el bundle `.app` sin instalador, por si lo
  necesitas.

## Cómo abre el cliente la app por primera vez

La app **no está firmada** con Apple Developer ID. macOS Gatekeeper bloqueará
el primer intento de abrirla. El cliente debe seguir uno de estos
procedimientos **solo la primera vez** — después la app abre con doble click
como cualquier otra.

### Procedimiento (macOS Sonoma y posteriores)

1. Doble click en el `.dmg` y arrastra `bitacora-medica.app` a la carpeta
   **Aplicaciones**.
2. Abre **Aplicaciones**, **Ctrl + click** sobre `bitacora-medica.app`,
   elige **Abrir**.
3. Aparece un diálogo: "macOS no puede verificar al desarrollador". Click en
   **Abrir** otra vez.
4. Si macOS sigue bloqueando: **Ajustes del Sistema → Privacidad y Seguridad
   → Seguridad**, busca el mensaje "bitacora-medica fue bloqueado" y click en
   **Abrir de todos modos**.

A partir de aquí abre normal.

### Si el cliente ve "está dañada y no se puede abrir"

macOS añade un atributo de cuarentena a archivos descargados que a veces
provoca este mensaje en builds sin firmar. Solución desde la terminal del
cliente:

```bash
xattr -cr /Applications/bitacora-medica.app
```

Luego abre la app normalmente.

## Notas

- Apple Silicon nativo (`aarch64-apple-darwin`) es el target por defecto en
  Macs M-series; no requiere flags adicionales.
- Para builds universales (Intel + Apple Silicon), correr en su lugar:

  ```bash
  rustup target add x86_64-apple-darwin
  npm run tauri build -- --target universal-apple-darwin
  ```

- La base de datos de cada cliente vive en
  `~/Library/Application Support/com.bitacora.medica/`. Backups y la app
  pueden coexistir entre versiones siempre que la contraseña sea la misma.

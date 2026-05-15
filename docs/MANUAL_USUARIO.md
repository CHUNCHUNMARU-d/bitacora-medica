# Bitácora Médica — Manual de Usuario

## ¿Qué es Bitácora Médica?

Bitácora Médica es una aplicación de escritorio para el registro y consulta de historial quirúrgico en **Trauma y Ortopedia**. Funciona completamente **sin conexión a internet** (offline-first) y cifra toda la información en tu dispositivo.

---

## Primeros Pasos

### Instalación

1. Descarga el instalador correspondiente a tu sistema operativo:
   - **Windows**: archivo `.msi`
   - **macOS**: archivo `.dmg`
   - **Linux**: archivo `.deb` o `.AppImage`

2. Ejecuta el instalador y sigue las instrucciones en pantalla.

### macOS — Nota importante

Si descargaste la app sin certificado de desarrollador, al primer inicio macOS la bloqueará. Para abrirla:

1. Ve a **Preferencias del Sistema → Seguridad y Privacidad**
2. Haz clic en **Abrir de todas formas**
3. O bien: `Ctrl + clic` sobre la app → **Abrir**

### Primer Inicio — Crear Contraseña

Al abrir la app por primera vez, se te pedirá crear una contraseña:

- Mínimo **8 caracteres**
- Esta contraseña **cifra toda la base de datos**
- **No se puede recuperar** si la olvidas
- Guárdala en un lugar seguro

---

## Pantallas de la Aplicación

### 1. Pantalla de Acceso (GateScreen)

Cada vez que abras la app, deberás ingresar tu contraseña para desbloquear la base de datos.

### 2. Dashboard

Es la pantalla principal. Muestra:

- **Resumen de cirugías** registradas
- **Estadísticas** y gráficas (procedimientos más frecuentes, evolución temporal, etc.)
- **Acceso rápido** a las funciones principales

### 3. Nueva Cirugía

Para registrar una nueva cirugía:

1. Haz clic en **Nueva Cirugía** (desde el Dashboard o la barra de navegación)
2. Completa los campos del formulario:
   - Datos del paciente
   - Fecha de la cirugía
   - Diagnóstico
   - Procedimiento realizado
   - Implantes utilizados
   - Notas y observaciones
3. Haz clic en **Guardar**

### 4. Detalle de Cirugía

Para ver o editar una cirugía existente:

1. Desde el Dashboard o la lista de cirugías, haz clic en el registro deseado
2. Podrás:
   - Ver todos los detalles
   - Editar información
   - Eliminar el registro (si es necesario)

### 5. Configuración

Accede desde el menú o barra lateral. Incluye:

#### Cambiar Contraseña
- Re-cifra la base de datos con la nueva contraseña
- Se recomienda hacer un respaldo antes

#### Crear Respaldo
- Genera una copia de seguridad de la base de datos (`bitacora.db`) y el archivo de cifrado (`bitacora.salt`)
- Se guardan con marca de tiempo en el directorio que elijas

#### Auto-bloqueo
- Configura el tiempo de inactividad antes de que la app se bloquee automáticamente
- Opciones: 5, 10, 15, 30, 60 minutos
- **Inactivo por defecto**

#### Tema de la interfaz
- Cambia entre modo claro y oscuro

---

## Respaldo y Restauración

### Crear un Respaldo

1. Ve a **Configuración → Crear respaldo...**
2. Selecciona la carpeta donde guardar los archivos
3. Se generarán dos archivos con marca de tiempo

### Restaurar desde un Respaldo

1. **Cierra la aplicación**
2. Ubica el directorio de datos:
   - **Linux**: `~/.local/share/com.bitacora.medica/`
   - **Windows**: `%APPDATA%\com.bitacora.medica\`
   - **macOS**: `~/Library/Application Support/com.bitacora.medica/`
3. Reemplaza los archivos `bitacora.db` y `bitacora.salt` con los de tu respaldo
4. Renombra los archivos quitando la marca de tiempo
5. Abre la app e ingresa con la contraseña activa cuando se generó el respaldo

---

## Búsqueda

La aplicación incluye búsqueda de texto completo (FTS) para encontrar cirugías rápidamente por:

- Nombre del paciente
- Diagnóstico
- Procedimiento
- Notas

Usa la barra de búsqueda en el Dashboard.

---

## Exportar Reportes

Puedes generar reportes en **PDF** con la información de las cirugías:

1. Ve a la lista de cirugías o al Dashboard
2. Selecciona las cirugías o el período deseado
3. Haz clic en **Exportar PDF**

---

## Seguridad

- **Cifrado**: SQLCipher (AES-256-CBC) con contraseña derivada mediante Argon2id
- **Sin conexión**: la app **nunca** se conecta a internet
- **Sin telemetría**: no se envía ningún dato a servidores externos
- **Auto-bloqueo**: configurable para proteger la app cuando no la usas

---

## Solución de Problemas

| Problema | Solución |
|----------|----------|
| Olvidé mi contraseña | No es posible recuperarla. Restaura desde un respaldo con la contraseña correcta |
| La app no inicia en macOS | Sigue las instrucciones de Gatekeeper arriba |
| Quiero cambiar de contraseña | Ve a Configuración → Cambiar contraseña (haz respaldo antes) |
| Necesito mover la app a otro equipo | Crea un respaldo, copia los archivos al nuevo equipo y restaúralos |

---

## Requisitos del Sistema

- **Windows**: Windows 10 o superior
- **macOS**: macOS 12 (Monterey) o superior
- **Linux**: Distribución con GTK3 y WebKit2GTK

---

## Soporte

Para reportar problemas o solicitar mejoras, contacta al desarrollador.

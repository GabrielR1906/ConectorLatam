# ConectorLatam MVP
## Guía Técnica y de Despliegue Completa

**Proyecto de Titulación · Carrera de Computación · UTPL**
**Versión 2.0 · Plataforma B2B SaaS de Integración Fiscal ETL/ELT**

---

## ¿Qué es ConectorLatam?

ConectorLatam es una **plataforma web SaaS corporativa (B2B)** que automatiza la extracción, transformación y carga (ETL/ELT) de datos fiscales emitidos por entes reguladores de Latinoamérica hacia destinos de datos en la nube.

**Problema que resuelve**: Las empresas con operaciones en varios países latinoamericanos necesitan consolidar sus comprobantes electrónicos (facturas, notas de crédito, retenciones) en un data warehouse para análisis contable y tributario. Este proceso es manual, lento y propenso a errores.

**Solución**: Conectores certificados que automatizan la descarga desde SRI (Ecuador), SAT (México), SUNAT (Perú) y DIAN (Colombia), normalizan los datos XML a formato tabular y los cargan en BigQuery, Snowflake o Redshift con deduplicación automática.

---

## ¿Qué contiene el MVP?

### 4 Módulos Funcionales

| Módulo | Descripción | Requerimientos |
|--------|-------------|----------------|
| **Portal Comercial** | Planes Starter ($149), Growth ($299), Multi-LATAM ($499) con prueba gratuita de 14 días | Modelo de Negocio |
| **Dashboard** | Monitoreo en tiempo real: KPIs, conectores activos, historial de 6 columnas | RF09, RF20 |
| **Wizard ETL** | Configuración en 3 pasos sin código: origen → credenciales → destino | RNF01, RF05-07, RF10, RNF03 |
| **Consola de Logs** | Terminal técnica con timestamps ISO 8601, syntax highlighting por nivel | RF17, RF22 |

### Stack Tecnológico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Frontend | HTML5 + CSS Vanilla + JavaScript ES6+ | Cero dependencias, máxima portabilidad |
| Tipografía | Inter + JetBrains Mono (Google Fonts) | UI corporativa + terminal auténtica |
| Backend | Python 3.x + Flask + Flask-CORS | Ligero, pythónico, ideal para APIs REST |
| Servidor producción | Gunicorn | WSGI estándar para despliegue en la nube |
| API | REST/JSON sobre HTTP | Estándar industrial |
| Datos | In-memory (demo) | Sin base de datos requerida para el MVP |
| Seguridad | AES-256 simulado (SHA-256 + Base64) | Demostración de RNF03 |

---

## Estructura de Archivos

```
Program/
│
├── 📁 backend/
│   ├── app.py              → API REST Flask (7 endpoints)
│   └── requirements.txt    → Dependencias Python
│
├── 📁 frontend/
│   ├── index.html          → Aplicación SPA (4 vistas)
│   ├── css/styles.css      → Design system completo
│   └── js/app.js           → Lógica frontend + integración API
│
├── instalar_y_ejecutar.bat      ⭐ EJECUTAR EN CUALQUIER PC
├── compartir_enlace_publico.bat ⭐ GENERAR ENLACE PÚBLICO
├── start.bat               → Arranque rápido (requiere instalación previa)
├── Procfile                → Para Render/Heroku (producción)
├── render.yaml             → Configuración Render.com
└── GUIA_COMPLETA.md        → Este documento
```

---

## API REST Disponible

| Método | Endpoint | Descripción |
|--------|---------|-------------|
| GET | `/api/metrics` | KPIs del dashboard + conectores |
| GET | `/api/connectors` | Lista de pipelines configurados |
| POST | `/api/connectors` | Crear conector (simula AES-256) |
| GET | `/api/logs` | Historial de ejecuciones ISO 8601 |
| POST | `/api/simulate-run` | Ejecutar pipeline manual |
| GET | `/api/plans` | Planes de suscripción |
| POST | `/api/trial` | Activar prueba gratuita 14 días |

---

# CÓMO EJECUTARLO — 4 OPCIONES

---

## OPCIÓN 1 — En tu computadora (Local)

**Requisito único:** Python 3.8 o superior instalado.

### Instalar Python (si no lo tienes)
1. Ve a **https://python.org/downloads**
2. Descarga Python 3.11 o superior
3. ⚠️ **IMPORTANTE**: Marca la casilla **"Add Python to PATH"** durante la instalación

### Ejecutar la aplicación

**Doble clic en `instalar_y_ejecutar.bat`** — el script hace todo automáticamente:
- Verifica que Python esté instalado
- Instala Flask y Flask-CORS
- Valida la estructura del proyecto
- Abre el navegador en http://localhost:5000

**O desde terminal:**
```cmd
pip install flask flask-cors
python backend/app.py
```

> **✅ Funciona sin internet** — si el backend no está activo, los datos demo se cargan automáticamente desde JavaScript.

---

## OPCIÓN 2 — Compartir con compañeros (ZIP + Local)

### Pasos:
1. **Comprime la carpeta `Program/`** en un archivo ZIP  
   (Clic derecho → "Comprimir" / WinRAR / 7-Zip)
2. **Comparte el ZIP** por WhatsApp, correo o Google Drive
3. Tu compañero:
   - Descomprime el ZIP
   - Hace doble clic en **`instalar_y_ejecutar.bat`**
   - El navegador se abre en `http://localhost:5000`

### Red Local (misma WiFi)
Si todos están en la misma red:
1. Obtén tu IP:
   ```cmd
   ipconfig
   ```
   Busca `IPv4 Address`, ejemplo: `192.168.1.25`
2. Los demás abren: `http://192.168.1.25:5000`

> Si el firewall bloquea: Panel de Control → Firewall → Permitir aplicación → Python

---

## OPCIÓN 3 — Enlace Público Temporal (ngrok)

**Genera un enlace HTTPS que cualquier persona en el mundo puede abrir.**  
El enlace funciona mientras tu computadora esté encendida y el script activo.

### Pasos:
1. Doble clic en **`compartir_enlace_publico.bat`**
2. El script inicia Flask y descarga ngrok automáticamente
3. Busca la línea `Forwarding` en la ventana:
   ```
   Forwarding  https://abc123.ngrok-free.app -> http://localhost:5000
   ```
4. **Copia y comparte ese enlace** — funciona desde cualquier dispositivo

### Notas:
- La URL cambia cada vez que reinicias (plan gratuito)
- Puedes crear una cuenta gratuita en https://ngrok.com para URL fija
- **Mantén la ventana abierta** — si la cierras, el enlace muere

---

## OPCIÓN 4 — Enlace Permanente en la Nube (Render.com — GRATIS)

**El enlace funciona 24/7 sin necesitar tu computadora.** Ideal para el tribunal.

### Requisitos:
- Cuenta en GitHub (https://github.com) — gratis
- Cuenta en Render (https://render.com) — gratis

### Paso 1: Subir a GitHub
1. En https://github.com → **New repository** → nombre: `conectorlatam-mvp` → Public
2. Haz clic en **"uploading an existing file"**
3. Arrastra **toda** la carpeta `Program/` y haz commit

### Paso 2: Desplegar en Render
1. En https://render.com → **New +** → **Web Service**
2. Conecta tu GitHub y selecciona el repositorio `conectorlatam-mvp`
3. Configura:
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `gunicorn --chdir backend app:app`
   - **Plan:** Free
4. Clic en **"Create Web Service"** — espera 3-5 minutos
5. ✅ Tu enlace permanente: `https://conectorlatam-mvp.onrender.com`

> **Nota:** En plan gratuito, la app se "duerme" tras 15 min sin uso. La primera visita puede tardar ~30 segundos. Eso es normal.

---

## Demo para el Tribunal (5-7 minutos)

| Tiempo | Acción | Qué demuestras |
|--------|--------|----------------|
| 0:00 | Dashboard | KPIs (14,250 XMLs), 2 conectores operativos, tabla 6 columnas ISO 8601 |
| 1:00 | Planes y Precios | 3 planes, márgenes, clic "Prueba 14 días" → modal con Trial ID |
| 2:00 | Wizard Paso 1 | Selecciona 🇲🇽 SAT México → campo cambia a "RFC" automáticamente |
| 3:00 | Wizard Paso 2 | Escribe RFC → aparece cifrado AES-256 en vivo; arrastra certificado |
| 4:00 | Wizard Paso 3 | Selecciona Amazon Redshift → badges RF05/RF06/RF07; "Guardar" → modal logs |
| 5:00 | Consola de Logs | Clic en fila → logs ISO 8601 animados; clic ▶ Run → nueva ejecución |

---

## Preguntas Frecuentes

**¿Por qué no se abre el navegador automáticamente?**  
Abre Chrome/Edge manualmente y escribe `http://localhost:5000`

**Aparece "port already in use"**  
El puerto 5000 está ocupado. Cierra otras aplicaciones o edita `app.py` cambiando el puerto a 5001.

**Los datos del dashboard no cargan**  
La ventana del servidor debe estar abierta. Si se cerró, los datos demo de JavaScript cargan automáticamente — la app sigue funcionando.

**El enlace de ngrok no funciona desde el celular**  
Asegúrate de que empiece con `https://`. Prueba con datos móviles en lugar de WiFi.

**En Render aparece "Service unavailable"**  
Espera 30-60 segundos — el plan gratuito suspende la app cuando no hay visitas.

**¿El backend es obligatorio para la demo?**  
No. El frontend tiene datos de fallback completos en JavaScript. Todo funciona sin Flask.

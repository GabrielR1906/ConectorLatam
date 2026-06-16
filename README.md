# ConectorLatam MVP

> **Plataforma SaaS de Integración de Datos Fiscales para Latinoamérica**

---

## 🚀 Inicio Rápido

### Opción 1 — Doble clic (Recomendado)
Ejecuta el archivo `start.bat` haciendo doble clic. Instalará todo automáticamente y abrirá el servidor.

Luego abre tu navegador en: **http://localhost:5000**

### Opción 2 — Terminal manual
```bash
# En la carpeta Program/
pip install flask flask-cors
python backend/app.py
```
Abre: **http://localhost:5000**

---

## 📁 Estructura del Proyecto

```
Program/
├── backend/
│   ├── app.py              # API Flask — 3 módulos REST
│   └── requirements.txt    # Dependencias Python
├── frontend/
│   ├── index.html          # Aplicación SPA principal
│   ├── css/
│   │   └── styles.css      # Design system completo
│   └── js/
│       └── app.js          # Lógica frontend con API integration
├── start.bat               # Launcher Windows (1 clic)
└── README.md               # Este archivo
```

---

## 🎯 Módulos del MVP

### 1. Dashboard de Monitoreo (`/`)
- **4 KPIs** animados: Total procesado, Hoy, Conectores activos, Tasa de éxito
- **Tarjetas de conectores** con estado "Operativo" en verde
- **Tabla de actividad** con últimas ejecuciones
- Actualización automática cada 15 segundos

### 2. Asistente de Configuración — Wizard (`/wizard`)
- **Paso 1 — Origen**: Botones visuales con banderas de países (Ecuador SRI activo, DIAN/SUNAT/SAT próximamente)
- **Paso 2 — Credenciales**: RUC, Clave de acceso, Carga de certificado .p12
- **Paso 3 — Destino**: BigQuery o Snowflake con tags técnicos
- **Al guardar**: Simulación realista de conexión con overlay de éxito y logs en vivo

### 3. Consola de Logs & Historial (`/logs`)
- **Tabla de historial** con badges de estado (SUCCESS / WARNING / ERROR)
- **Terminal negra** estilo bash con syntax highlighting de logs
- **Ejecución manual** del pipeline con logs animados en tiempo real

---

## 🛠 Stack Técnico

| Capa | Tecnología |
|------|-----------|
| Backend | Python 3.x + Flask + Flask-CORS |
| Frontend | HTML5 + CSS3 (Vanilla) + JavaScript ES6+ |
| Tipografía | Inter + JetBrains Mono (Google Fonts) |
| API | REST JSON sobre HTTP |
| Datos | In-memory (demo/MVP) |

---

## 📡 Endpoints API

```
GET  /api/metrics        → KPIs del dashboard
GET  /api/connectors     → Lista de conectores
POST /api/connectors     → Crear nuevo conector
GET  /api/logs           → Historial de ejecuciones
POST /api/simulate-run   → Disparar pipeline manual
```

---

## 💡 Nota para la Presentación

La app funciona **con o sin el backend activo**:
- **Con Flask corriendo**: datos dinámicos y persistencia en sesión
- **Sin Flask (solo HTML)**: datos de demo pre-cargados en JS

Para abrir solo el frontend estático: abre `frontend/index.html` directamente en el navegador.

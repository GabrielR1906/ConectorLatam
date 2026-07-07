@echo off
chcp 65001 > nul
title ConectorLatam — Instalación Rápida

echo.
echo  ╔══════════════════════════════════════════════════════╗
echo  ║       ConectorLatam MVP — Instalación Rápida         ║
echo  ║       Plataforma de Integración Fiscal LATAM         ║
echo  ╚══════════════════════════════════════════════════════╝
echo.

:: ── Paso 1: Verificar Python ──────────────────────────────────
echo  [1/4] Verificando Python...
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  [ERROR] Python no está instalado en esta computadora.
    echo.
    echo  Por favor:
    echo  1. Ve a https://python.org/downloads
    echo  2. Descarga Python 3.11 o superior
    echo  3. Durante la instalacion, marca "Add Python to PATH"
    echo  4. Vuelve a ejecutar este archivo
    echo.
    pause
    start https://python.org/downloads
    exit /b 1
)
for /f "tokens=*" %%v in ('python --version') do set PY_VER=%%v
echo  [OK] %PY_VER% detectado

:: ── Paso 2: Instalar dependencias ────────────────────────────
echo.
echo  [2/4] Instalando dependencias Python...
pip install flask flask-cors --quiet --disable-pip-version-check
if %errorlevel% neq 0 (
    echo  [ERROR] Error al instalar dependencias.
    echo  [TIP]   Intenta ejecutar como Administrador (clic derecho → Ejecutar como administrador)
    pause
    exit /b 1
)
echo  [OK] Flask y Flask-CORS instalados correctamente

:: ── Paso 3: Verificar estructura ─────────────────────────────
echo.
echo  [3/4] Verificando archivos del proyecto...
if not exist backend\app.py (
    echo  [ERROR] No se encontro backend\app.py
    echo  [INFO]  Asegurate de ejecutar este archivo DESDE la carpeta del proyecto.
    echo  [INFO]  La carpeta debe contener: backend\, frontend\, start.bat
    pause
    exit /b 1
)
echo  [OK] Estructura del proyecto correcta

:: ── Paso 4: Iniciar servidor ──────────────────────────────────
echo.
echo  [4/4] Iniciando ConectorLatam...
echo.
echo  ══════════════════════════════════════════════════════════
echo    SERVIDOR LISTO EN:  http://localhost:5000
echo    Abre esa URL en Chrome, Edge o Firefox
echo    Presiona Ctrl+C en esta ventana para detener
echo  ══════════════════════════════════════════════════════════
echo.

:: Abrir navegador automáticamente después de 2 segundos
timeout /t 2 /nobreak > nul
start http://localhost:5000
python backend\app.py
pause

@echo off
chcp 65001 > nul
title ConectorLatam — Setup

echo.
echo  ╔═══════════════════════════════════════════╗
echo  ║     ConectorLatam MVP — Setup             ║
echo  ║     Plataforma de Integración Fiscal      ║
echo  ╚═══════════════════════════════════════════╝
echo.

:: Check Python
python --version > nul 2>&1
if %errorlevel% neq 0 (
    echo  [ERROR] Python no está instalado. Descárgalo de python.org
    pause
    exit /b 1
)

echo  [OK] Python detectado
echo.

:: Install dependencies
echo  [INFO] Instalando dependencias Python...
pip install flask flask-cors --quiet
if %errorlevel% neq 0 (
    echo  [ERROR] No se pudieron instalar las dependencias.
    pause
    exit /b 1
)
echo  [OK] Dependencias instaladas
echo.

echo  [INFO] Iniciando servidor backend en http://localhost:5000
echo  [INFO] Abre tu navegador en: http://localhost:5000
echo.
echo  Presiona Ctrl+C para detener el servidor.
echo.

:: Start backend
python backend\app.py

@echo off
title ConectorLatam - Enlace Publico con Ngrok

echo.
echo  =======================================================
echo        ConectorLatam - Generar Enlace Publico
echo        Comparte la app con cualquier persona online
echo  =======================================================
echo.
echo  Este script genera un enlace HTTPS publico usando ngrok.
echo  Cualquier persona con el enlace puede ver la app.
echo.

REM Instalar dependencias Flask si no estan
echo  [1/3] Preparando servidor Flask...
pip install flask flask-cors --quiet --disable-pip-version-check
echo  [OK] Dependencias listas

REM Iniciar Flask en segundo plano
echo.
echo  [2/3] Iniciando servidor local en puerto 5000...
start /min cmd /c "python backend\app.py"
timeout /t 3 /nobreak > nul
echo  [OK] Servidor Flask activo en http://localhost:5000

REM Verificar/Instalar ngrok
echo.
echo  [3/3] Verificando ngrok...
where ngrok > nul 2>&1
if %errorlevel% neq 0 (
    echo  [INFO] ngrok no encontrado. Descargando...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip' -OutFile 'ngrok_temp.zip'; Expand-Archive -Path 'ngrok_temp.zip' -DestinationPath '.' -Force; Remove-Item 'ngrok_temp.zip'}" 2>nul
    if not exist ngrok.exe (
        echo  [ERROR] No se pudo descargar ngrok automaticamente.
        echo.
        echo  OPCION MANUAL:
        echo  1. Ve a https://ngrok.com/download
        echo  2. Descarga ngrok para Windows
        echo  3. Extrae ngrok.exe en esta carpeta
        echo  4. Vuelve a ejecutar este archivo
        echo.
        pause
        start https://ngrok.com/download
        exit /b 1
    )
    echo  [OK] ngrok descargado correctamente
) else (
    echo  [OK] ngrok ya instalado
)

echo  ==========================================================
echo.
echo  INSTRUCCIONES IMPORTANTES:
echo  1. Al presionar una tecla abajo, se abrira la pantalla de ngrok.
echo  2. Busca la linea que dice "Forwarding".
echo  3. Ahi veras un enlace unico con letras y numeros aleatorios.
echo     Ejemplo: https://a1b2-34-56-78.ngrok-free.app
echo  4. ¡NO COPIES EL TEXTO "XXXX"! Copia tu enlace real que aparezca en pantalla.
echo  5. Comparte ese enlace real con tus compañeros.
echo     (Funcionara siempre que mantengas abierta esta ventana).
echo.
echo  NOTA: Si ngrok te pide un "authtoken", registrate gratis en
echo  https://ngrok.com y ejecuta en una terminal:
echo  ngrok config add-authtoken TU_TOKEN_AQUI
echo.
echo  ==========================================================
echo.
pause

REM Ejecutar ngrok
ngrok http 5000
echo.
echo  [ERROR] ngrok se ha cerrado inesperadamente.
echo  Por favor lee el mensaje de error arriba (puede que te pida un authtoken).
pause

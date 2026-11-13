
@echo off
title Ejecutar juego WebAssembly
cd /d "%~dp0"

echo ========================================
echo     INICIANDO JUEGO WEBASSEMBLY
echo ========================================
echo.

if not exist "index.html" (
    echo ERROR: No se encontro index.html.
    pause
    exit /b 1
)

if not exist "juego_preguntas.js" (
    echo ERROR: No se encontro juego_preguntas.js.
    echo Ejecuta primero compile_wasm.bat.
    pause
    exit /b 1
)

if not exist "juego_preguntas.wasm" (
    echo ERROR: No se encontro juego_preguntas.wasm.
    echo Ejecuta primero compile_wasm.bat.
    pause
    exit /b 1
)

set "PYTHON="

REM Buscar Python instalado normalmente
where py >nul 2>nul
if not errorlevel 1 (
    py -3 --version >nul 2>nul
    if not errorlevel 1 set "PYTHON=py -3"
)

if not defined PYTHON (
    where python >nul 2>nul
    if not errorlevel 1 (
        python --version >nul 2>nul
        if not errorlevel 1 set "PYTHON=python"
    )
)

REM Buscar el Python instalado con Emscripten
if not defined PYTHON (
    if exist "%USERPROFILE%\Documents\emsdk\python\3.13.3_64bit\python.exe" (
        set "PYTHON=%USERPROFILE%\Documents\emsdk\python\3.13.3_64bit\python.exe"
    )
)

if not defined PYTHON (
    echo ERROR: No se encontro Python.
    echo Comprueba la instalacion de Python o Emscripten.
    pause
    exit /b 1
)

echo Iniciando servidor local con guardado automatico de puntajes...
%PYTHON% server.py --launch
if errorlevel 1 (
    echo.
    echo No se pudo iniciar el servidor local del juego.
    pause
    exit /b 1
)

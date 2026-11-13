@echo off
cd /d "%~dp0"
set "EMCC="

if exist "%USERPROFILE%\Documents\emsdk\upstream\emscripten\emcc.exe" goto use_documents_emsdk
if exist "%USERPROFILE%\emsdk\upstream\emscripten\emcc.exe" goto use_user_emsdk
goto missing_emsdk

:use_documents_emsdk
set "EMSDK_ROOT=%USERPROFILE%\Documents\emsdk"
goto compile_wasm

:use_user_emsdk
set "EMSDK_ROOT=%USERPROFILE%\emsdk"

:compile_wasm
set "EMCC=%EMSDK_ROOT%\upstream\emscripten\emcc.exe"
set "EMSDK=%EMSDK_ROOT%"
set "PATH=%EMSDK_ROOT%\upstream\emscripten;%EMSDK_ROOT%\upstream\bin;%EMSDK_ROOT%\node\24.19.0_64bit;%EMSDK_ROOT%\python\3.13.3_64bit;%PATH%"
"%EMCC%" -std=c11 -O2 -Wall -Wextra -Wpedantic -sENVIRONMENT=web --no-entry -sEXPORTED_RUNTIME_METHODS=cwrap -o juego_preguntas.js juego_preguntas.c
if errorlevel 1 (
    echo Error al compilar la version WebAssembly.
    pause
    exit /b 1
)

echo Compilacion WebAssembly exitosa.
echo Archivos generados: juego_preguntas.js y juego_preguntas.wasm
pause
exit /b 0

:missing_emsdk
echo No se encontro Emscripten (emcc).
echo Instala Emscripten en Documents\emsdk o en la carpeta de usuario.
echo Rutas comprobadas:
echo   "%USERPROFILE%\Documents\emsdk"
echo   "%USERPROFILE%\emsdk"
pause
exit /b 1

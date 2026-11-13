@echo off
cd /d "%~dp0"
if exist "%SystemDrive%\msys64\ucrt64\bin\gcc.exe" set "PATH=%SystemDrive%\msys64\ucrt64\bin;%PATH%"
where gcc >nul 2>nul
if errorlevel 1 (
    echo GCC no esta instalado o no esta en PATH.
    echo Instala MinGW o MSYS2 y asegura que su carpeta bin este en PATH.
    echo Ejemplo: C:\\MinGW\\bin
    echo.
    echo Este archivo compila solo la version de consola.
    echo Para jugar en el navegador, ejecuta run_game.bat; no requiere GCC.
    pause >nul
    exit /b 1
)

gcc -std=c11 -Wall -Wextra juego_preguntas.c -o juego_preguntas.exe
if errorlevel 1 (
    echo Error al compilar el juego.
    pause >nul
    exit /b 1
)

echo Compilacion exitosa.
echo Ejecuta: .\juego_preguntas.exe
pause >nul

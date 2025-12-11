@echo off
cd /d "%~dp0"

echo ==================================================
echo    Formal Language Simulator - Quick Launcher
echo ==================================================
echo Starting local server at port 8000...
echo Opening http://localhost:8000/web_gui/public/ ...
echo --------------------------------------------------
echo Keep this window open while using the simulator.
echo Close this window to stop the server.
echo ==================================================

:: Open the browser after 2 seconds to give the server time to start
timeout /t 2 /nobreak >nul
start "" "http://localhost:8000/web_gui/public/"

:: Try to use python (standard command)
python -m http.server 8000
if %errorlevel% equ 0 goto end

:: Try python3 as fallback
python3 -m http.server 8000
if %errorlevel% equ 0 goto end

:: Try py launcher as fallback
py -m http.server 8000
if %errorlevel% equ 0 goto end

:: If all fail
echo.
echo [ERROR] Python was not found. 
echo To run this application, Python must be installed.
echo Please install it from the Microsoft Store or python.org.
echo.
pause

:end

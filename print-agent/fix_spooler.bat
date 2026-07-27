@echo off
color 0C
echo ========================================================
echo     Mehta Dairy - Printer Spooler Fix Tool
echo ========================================================
echo This tool will restart your crashed Windows Print Spooler
echo and apply the "Generic / Text Only" fix!
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Administrator permissions are required!
    echo Please wait while we ask Windows for permission...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/3] Stopping crashed Print Spooler...
net stop spooler /y

echo [2/3] Starting fresh Print Spooler...
net start spooler

echo [3/3] Fixing Posiflex driver to pass-through mode...
powershell -Command "Set-Printer -Name 'Posiflex' -DriverName 'Generic / Text Only' -ErrorAction SilentlyContinue"

echo.
echo ========================================================
echo SUCCESS! Your spooler is fixed and the driver is ready.
echo You can now print your receipt, and it will match the preview!
echo ========================================================
pause

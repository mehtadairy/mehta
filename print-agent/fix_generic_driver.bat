@echo off
color 0C
echo ========================================================
echo     Mehta Dairy - Ultimate Printer Fix
echo ========================================================
echo We need to force Windows to install the Generic Text Driver!
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Administrator permissions are required!
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/3] Adding Generic / Text Only Driver to Windows...
powershell -Command "Add-PrinterDriver -Name 'Generic / Text Only'"

echo [2/3] Setting Posiflex to use the Generic Driver...
powershell -Command "Set-Printer -Name 'Posiflex' -DriverName 'Generic / Text Only'"

echo [3/3] Verifying...
powershell -Command "Get-Printer -Name 'Posiflex' | Select-Object Name, DriverName"

echo.
echo ========================================================
echo If you see 'Generic / Text Only' above, it worked!
echo ========================================================
pause

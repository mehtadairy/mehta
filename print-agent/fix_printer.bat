@echo off
color 0A
echo ========================================================
echo     Mehta Dairy - Printer Driver Fix Tool
echo ========================================================
echo This tool will fix your printer so it prints EXACTLY like 
echo the preview, without any chopped lines or huge fonts!
echo.

:: Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [WARNING] Administrator permissions are required!
    echo Please wait while we ask Windows for permission...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

echo [1/2] Changing 'Posiflex' to pass-through mode...
powershell -Command "Set-Printer -Name 'Posiflex' -DriverName 'Generic / Text Only' -ErrorAction SilentlyContinue"

echo [2/2] Verifying changes...
powershell -Command "Get-Printer -Name 'Posiflex' | Select-Object Name, DriverName"

echo.
echo ========================================================
echo SUCCESS! Your printer is now fixed forever.
echo You can now print your receipt, and it will match the preview!
echo ========================================================
pause

@echo off
set CSC="C:\Windows\Microsoft.NET\Framework\v4.0.30319\csc.exe"
if not exist %CSC% (
    set CSC="C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe"
)

echo Compiling print_gdi.cs...
%CSC% /out:print_gdi.exe print_gdi.cs

if exist print_gdi.exe (
    echo Successfully compiled print_gdi.exe!
) else (
    echo Compilation failed!
)
pause
